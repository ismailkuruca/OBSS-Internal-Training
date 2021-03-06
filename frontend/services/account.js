angular.module('MyApp')
    .factory('Account', function ($http) {
        return {
            getProfile: function () {
                return $http.get(window.backendUrl + '/api/me');
            },
            getCurrentUser: function () {
                return $http.get(window.backendUrl + '/api/me');
            },
            updateProfile: function (profileData) {
                return $http.put(window.backendUrl + '/api/me', profileData);
            },
            getUserList: function () {
                return $http.get(window.backendUrl + '/getUsers');
            },
            getFriendList: function () {
                return $http.get(window.backendUrl + '/getFriendList');
            },
            uploadPhoto: function (fd) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/uploadPhoto',
                    data: {
                        photo: fd
                    }
                });
            }
        }
    })
    .factory('Map', function ($q, $http) {
        var lastKnownLocation;
        return {
            getLocation: function () {
                return $q(function (resolve, reject) {
                    return navigator.geolocation.getCurrentPosition(function (pos) {
                        lastKnownLocation = pos;
                        resolve(pos);
                    }, function (error) {
                        if (lastKnownLocation) {
                            resolve(lastKnownLocation);
                        } else {
                            reject(error);
                        }
                    }, {timeout: 10000});
                });
            }
        };
    })
    .factory('Dashboard', function ($http) {
        return {
            searchFriend: function (query) {
                return $http.post(window.backendUrl + '/searchFriend', query);
            },
            addFriend: function (id) {
                return $http({
                    method: 'POST',
                    data: {
                        id: id
                    },
                    url: window.backendUrl + '/addFriend',
                });
            },
            checkIn: function (checkIn) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/checkIn',
                    data: {
                        id: checkIn.id,
                        placeName: checkIn.name,
                        lat: checkIn.lat,
                        lng: checkIn.lng,
                        comment: checkIn.comment
                    }
                });
            },
            getCheckInList: function (latSW, lngSW, latNE, lngNE) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/getCheckInList',
                    data: {
                        latSW: latSW,
                        lngSW: lngSW,
                        latNE: latNE,
                        lngNE: lngNE
                    }
                });
            },
            getSavedList: function () {
                return $http.get(window.backendUrl + '/getSavedList');
            },
            saveCheckIn: function (id) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/saveCheckIn',
                    data: {
                        id: id
                    }
                });
            },
            likeCheckIn: function (id) {
                return $http({
                    method: 'POST',
                    url: window.backendUrl + '/likeCheckIn',
                    data: {
                        id: id
                    }
                });
            }

        }
    });