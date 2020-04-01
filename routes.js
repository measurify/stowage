const express = require('express');
const router = express.Router();
const passport = require('passport');

// login
const loginRoute = require('./routes/loginRoute');
router.use('/' + process.env.VERSION + '/login', loginRoute);

// demo
const demoRoute = require('./routes/demoRoute');
router.use('/' + process.env.VERSION + '/demo', passport.authenticate('jwt', {session: false}), demoRoute);

// log
const logRoute = require('./routes/logRoute');
router.use('/' + process.env.VERSION + '/log', passport.authenticate('jwt', {session: false}), logRoute);

// errors
const errorRoute = require('./routes/errorRoute');
router.use('/' + process.env.VERSION + '/errors', errorRoute);

// user
const userRoute = require('./routes/userRoute');
router.use('/' + process.env.VERSION + '/users', passport.authenticate('jwt', {session: false}), userRoute);
const usernameRoute = require('./routes/usernameRoute');
router.use('/' + process.env.VERSION + '/usernames', passport.authenticate('jwt', {session: false}), usernameRoute);

// element
const elementsRoute = require('./routes/elementRoute');
router.use('/' + process.env.VERSION + '/elements', passport.authenticate('jwt', {session: false}), elementsRoute);

// tag
const tagsRoute = require('./routes/tagRoute');
router.use('/' + process.env.VERSION + '/tags', passport.authenticate('jwt', {session: false}), tagsRoute);

// info 
const infoRoute = require('./routes/infoRoute');
router.use('/' + process.env.VERSION + '/info', passport.authenticate('jwt', {session: false}), infoRoute);

module.exports = router;
