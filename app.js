var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
//var partials = require('express-partials');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var seq = require('./models/sequelizeConnection');
var User = require('./models/user')(seq);
var usersOnline = [] ;



// view engine setup
//app.use(partials());
app.set('views', path.join(__dirname, 'views'));
//app.set('view options', {defaultLayout : 'layout'});
app.set('view engine', 'hbs');

//express validator
app.use(expressValidator({
        errorFormatter: function(param, msg, value) {
            var namespace = param.split('.')
                , root    = namespace.shift()
                , formParam = root;

            while(namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                param : formParam,
                msg   : msg,
                value : value
            };
        }
    }

));

app.use(cookieParser());
//express session
app.use(session({
        secret: 'secret',
        saveUninitialized: true,
        resave : true
    })
);

//passport init
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//global vars
app.use(function (req,res,next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.docState = false ;
    res.locals.utilisateur = req.user || null;
    res.locals.reqURL  = req.url ;


    console.log(req.url);
    if(req.url == "/users/logout"){
        var index = usersOnline.indexOf(res.locals.utilisateur.dataValues.id.toString());
        console.log("index : " + index);
        if(index != -1) {
            //console.log("dkhaal dkhaaal");
            usersOnline.splice(index, 1);
        }


    }
    else {
        if (res.locals.utilisateur && !usersOnline.includes(res.locals.utilisateur.dataValues.id.toString()))
            usersOnline.push(res.locals.utilisateur.dataValues.id.toString());

        console.log("users online : " + usersOnline.length);
        User.allUsers(function (users) {


            if (users && users.length > 0) {
                users.forEach(function (user) {
                    usersOnline.includes(user.dataValues.id.toString()) ?
                        user.connected(true, function () {
                            //console.log("user connected");
                        })
                        : user.connected(false, function () {
                        //console.log("user disconnected");
                    });

                });

            }

        });
    }

    next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname,'bower_components')));

app.use('/', index);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports= app;

