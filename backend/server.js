/**
 * Satellizer Node.js Example
 * (c) 2015 Sahat Yalkabov
 * License: MIT
 */

var path = require('path');
var qs = require('querystring');

var async = require('async');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var colors = require('colors');
var cors = require('cors');
var express = require('express');
var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');

var config = require('./config');
var profile = require('./profile');

var userSchema = new mongoose.Schema({
    email: {type: String, unique: true, lowercase: true},
    password: {type: String, select: false},
    displayName: String,
    picture: String,
    facebook: String,
    friends: [String],
    saved: [CheckIn]
});

var checkInSchema = new mongoose.Schema({
    placeId: {type: String, lowercase: true},
    placeName: String,
    lat: Number,
    lng: Number,
    userId: String,
    comment: String,
    date: Date,
    likes: []
})


userSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(user.password, salt, function (err, hash) {
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function (password, done) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        done(err, isMatch);
    });
};

var User = mongoose.model('User', userSchema);
var CheckIn = mongoose.model('CheckIn', checkInSchema);

mongoose.connect(config.MONGO_URI);
mongoose.connection.on('error', function (err) {
    console.log('Error: Could not connect to MongoDB. Did you forget to run `mongod`?'.red);
});

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Force HTTPS on Heroku
if (app.get('env') === 'production') {
    app.use(function (req, res, next) {
        var protocol = req.get('x-forwarded-proto');
        protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
    });
}

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send({message: 'Please make sure your request has an Authorization header'});
    }
    var token = req.headers.authorization.split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        return res.status(401).send({message: err.message});
    }


    if (payload.exp <= moment().unix()) {
        return res.status(401).send({message: 'Token has expired'});
    }
    req.user = payload.sub;
    next();
}

function populateUser(req, res, next) {
    console.log(req.user);

    User.findOne({_id: req.user}, function (err, user) {
        if (err) {
            console.log(err);
        }
        req.userInfo = user;
        next();
    });
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        res.send(user);
    });
});

/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
app.put('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        if (!user) {
            return res.status(400).send({message: 'User not found'});
        }
        user.displayName = req.body.displayName || user.displayName;
        user.email = req.body.email || user.email;
        user.save(function (err) {
            res.status(200).end();
        });
    });
});


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function (req, res) {
    User.findOne({email: req.body.email}, '+password', function (err, user) {
        if (!user) {
            return res.status(401).send({message: 'Invalid email and/or password'});
        }
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (!isMatch) {
                return res.status(401).send({message: 'Invalid email and/or password'});
            }
            res.send({token: createJWT(user)});
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
app.post('/auth/signup', function (req, res) {
    User.findOne({email: req.body.email}, function (err, existingUser) {
        if (existingUser) {
            return res.status(409).send({message: 'Email is already taken'});
        }
        var user = new User({
            displayName: req.body.displayName,
            email: req.body.email,
            password: req.body.password
        });
        user.save(function () {
            res.send({token: createJWT(user)});
        });
    });
});

app.get('/searchFriend', ensureAuthenticated, function (req, res) {
    User.find({displayName: new RegExp(req.query.query, 'i')}, function (err, userList) {
        console.log(err);
        console.log(userList);
        console.log(req.query.query);
        if (userList) {
            return res.status(200).send(userList);
        }
    });
});

app.post('/addFriend', ensureAuthenticated, populateUser, function (req, res) {
    User.findOne({email: req.body.email}, function (err, user) {
        if (user) {
            console.log(req.user);
            req.userInfo.friends.push(user.email);
            User.update({_id: req.user._id}, req.userInfo, function (err, affected, resp) {
                if (!err) {
                    res.status(200).send(req.userInfo);
                } else {
                    console.log(err);
                }
            });

        } else {
            res.status(409).send("Not found");
        }
    });
});

app.post('/checkIn', ensureAuthenticated, populateUser, function (req, res) {
    var checkIn = new CheckIn({
        placeId: req.body.id,
        placeName: req.body.name,
        lat: req.body.lat,
        lng: req.body.lng,
        userId: req.userInfo._id,
        comment: req.body.comment,
        likes: [],
        date: new Date()
    });

    checkIn.save(function () {
        res.status(200).send("OK");
    });
});

app.post('/like', ensureAuthenticated, populateUser, function (req, res) {
    CheckIn.findOne({_id: req.body.id}, function (err, checkIn) {
        if (checkIn) {
            var likes = checkIn.likes;
            var flag = true;
            for (var i = 0; i < likes.length; i++) {
                if (likes[i] == req.userInfo.email) {
                    flag = false;
                }
            }
            if (flag && checkIn.userId != req.userInfo._id) {
                likes.push(req.userInfo.email);
            }
            CheckIn.update({_id: req.body.id}, {
                likes: likes
            }, function (err, affected, checkIn) {
                if (!err) {
                    res.status(200).send("OK");
                } else {
                    console.log(err);
                    res.send(400);
                }
            });
        }
    });
});

app.post('/getCheckInList', ensureAuthenticated, function (req, res) {
    var latSW = req.body.latSW;
    var lngSW = req.body.lngSW;
    var latNE = req.body.latNE;
    var lngNE = req.body.lngNE;

    console.log(latSW, lngSW, latNE, lngNE);

    CheckIn.find({lat: {$gt: latSW, $lt: latNE}, lng: {$gt: lngSW, $lt: lngNE}}, function (err, result) {
        if (!err) {
            res.status(200).send(result);
        } else {
            console.log(err);
            res.status(400).send(err);
        }
    });
});

app.post('/saveCheckIn', ensureAuthenticated, populateUser, function (req, res) {
    CheckIn.findOne({_id: req.body.id}, function (err, checkIn) {
        if (!err) {
            User.update({_id: req.userInfo._id}, {
                $addToSet: {saved: checkIn}
            }, function (err, affected, user) {
                if (!err) {
                    res.status(200).send(user);
                } else {
                    console.log(err);
                    res.status(400).send(err);
                }
            });
        } else {
            console.log(err);
            res.status(400).send(err);
        }
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with Facebook
 |--------------------------------------------------------------------------
 */
app.post('/auth/facebook', function (req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({url: accessTokenUrl, qs: params, json: true}, function (err, response, accessToken) {
        if (response.statusCode !== 200) {
            return res.status(500).send({message: accessToken.error.message});
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
            if (response.statusCode !== 200) {
                return res.status(500).send({message: profile.error.message});
            }
            console.log(profile);
            if (req.headers.authorization) {
                User.findOne({facebook: profile.id}, function (err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({message: 'There is already a Facebook account that belongs to you'});
                    }
                    var token = req.headers.authorization.split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);
                    User.findById(payload.sub, function (err, user) {
                        if (!user) {
                            return res.status(400).send({message: 'User not found'});
                        }
                        user.facebook = profile.id;
                        user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                        user.displayName = user.displayName || profile.name;
                        user.save(function () {
                            var token = createJWT(user);
                            res.send({token: token});
                        });
                    });
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                User.findOne({facebook: profile.id}, function (err, existingUser) {
                    if (existingUser) {
                        var token = createJWT(existingUser);
                        return res.send({token: token});
                    }
                    var user = new User();
                    user.facebook = profile.id;
                    user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                    user.displayName = profile.name;
                    user.save(function () {
                        var token = createJWT(user);
                        res.send({token: token});
                    });
                });
            }
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */
app.post('/auth/unlink', ensureAuthenticated, function (req, res) {
    var provider = req.body.provider;
    var providers = ['facebook', 'foursquare', 'google', 'github', 'instagram',
        'linkedin', 'live', 'twitter', 'twitch', 'yahoo'];

    if (providers.indexOf(provider) === -1) {
        return res.status(400).send({message: 'Unknown OAuth Provider'});
    }

    User.findById(req.user, function (err, user) {
        if (!user) {
            return res.status(400).send({message: 'User Not Found'});
        }
        user[provider] = undefined;
        user.save(function () {
            res.status(200).end();
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */
app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
