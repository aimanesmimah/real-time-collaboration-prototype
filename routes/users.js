var express = require('express');
var router = express.Router();

var passport = require('passport');
var LocalStrategy = require('passport-local');
var seq = require('../models/sequelizeConnection');
var User = require('../models/user')(seq);



/* GET users listing. */
router.get('/register', function(req, res, next) {
    res.render('register', {errors : null});
});

router.get('/login', function(req, res, next) {
    console.log('user : ' + res.locals.utilisateur);
    res.render('login');
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        /*User.findOne({ username: username }, function(err, user) {
         if (err) { return done(err); }
         if (!user) {
         return done(null, false, { message: 'Incorrect username.' });
         }
         if (!user.validPassword(password)) {
         return done(null, false, { message: 'Incorrect password.' });
         }
         return done(null, user);
         });*/
        User.getUserByUsername(username,function (user) {


            if(!user)
                return done(null, false, { message: 'Unknown user' });

            user.comparePassword(password,function (err,isMatch) {
                if(err) throw err;
                if(isMatch) return done(null,user);
                else return done(null,false,{message : 'Invalid password'});
            });

        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.dataValues.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(user) {
        done(null, user);
    });
});

router.post('/login',passport.authenticate('local', {
    successRedirect : '/' , failureRedirect : '/users/login',failureFlash : true
}) ,function (req,res) {

    res.redirect('/');
});

router.get('/logout',function (req,res,next) {

    /*res.locals.utilisateur.connected(false,function () {
     console.log("user " + res.locals.utilisateur.username + "disconnected")
     });*/


    //console.log("user dis : " + req.disconnected);
    req.logout();

    req.flash('success_msg','you are logged out');

    res.redirect('/users/login');
});

router.post('/register', function(req, res, next) {
    var last_name = req.body.last_name;
    var first_name = req.body.first_name;
    var age = req.body.age ;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.passwd;
    var passwordConf = req.body.passwdConf;


    //console.log("name :" +name);

    //validation
    req.checkBody('first_name','first name is required').notEmpty();
    req.checkBody('last_name','last name is required').notEmpty();
    req.checkBody('email','email is required').notEmpty();
    req.checkBody('email','email is invalid').isEmail();
    req.checkBody('age','age is required').notEmpty();
    //req.checkBody('age','age must be a number').isNumber();
    req.checkBody('username','username is required').notEmpty();
    req.checkBody('passwd','password is required').notEmpty();
    req.checkBody('passwdConf','passwords do not match').equals(req.body.passwd);

    var errors = req.validationErrors();

    if(errors){
        console.log('error');
        res.render('register',{
            errors : errors
        });

    }
    else {
        var newUser = User.build({
            last_name : last_name,
            first_name : first_name,
            email : email,
            username : username,
            password : password,
            age : age

        });

        User.addNewUser(newUser,function () {

            console.log('user added successfully');
        });

        req.flash('success_msg','You are registered and can now login');
        res.redirect('/users/login');
    }

    //res.render('register');
});

module.exports= router;


