# OBSS-Internal-Training-MEAN Stack Project
This app is designed and developed for learning purposes and it's not actively maintained. 
This guide will walk you through setup and deployment process of my app.

## Setup & Deployment Steps

###1. [Install MongoDB](https://docs.mongodb.org/manual/installation/)
###2. [Install NodeJS](https://nodejs.org/en/download/)
###3. Setting up a HTTP Server
I personally use basic node http-server to serve client app. You can install it with `npm install -g http-server`
###4. Basic Configuration and Deployment
* Default MongoDB port is defined as 27017 in backend/config.js file. 
* Default server port is defined as localhost:3000 in frontend/app.js:1
* Server can be started with `node server.js`
* Basic HTTP server can be started with `http-server -p 3000 frontend/`
