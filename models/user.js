/**
 * Created by cloudStrife on 10/06/2017.
 */

//var seq = require('./sequelizeConnection');
var bcrypt = require('bcryptjs');


module.exports = function (seq) {
    var User = seq.connection.define('user', {
        username : {
            type : seq.Sequelize.STRING ,
            allowNull : false,
            unique : true
        },
        password : {
            type : seq.Sequelize.STRING,
            allowNull : false
        },
        email : {
            type : seq.Sequelize.STRING,
            unique : true,
            allowNull : false
        },
        last_name : {
            type : seq.Sequelize.STRING,
            allowNull : false
        },
        first_name : {
            type : seq.Sequelize.STRING,
            allowNull : false
        },
        age : {
            type : seq.Sequelize.INTEGER,
            allowNull : true
        },
        isConnected : {
            type : seq.Sequelize.BOOLEAN ,
            allowNull : false ,
            defaultValue : false
        },
        last_signin_Date : {
            type : seq.Sequelize.DATE
        }
    }, {
        createdAt: 'signup_date'

    });



    User.allUsers = function (cb) {
        this.findAll().then(cb);
    };

    User.addNewUser = function (newUser,cb) {
        bcrypt.genSalt(10,function (err,salt) {
            bcrypt.hash(newUser.password,salt,function (err, hash) {
                newUser.password = hash ;
                newUser.save().then(cb);
            });
        });
    };

    User.getUserByUsername = function (username,cb) {
      this.findOne({where : { username : username}}).then(cb);
    };

    User.getUserById = function (id,cb) {
      this.findById(id).then(cb);
    };

    User.getUserByEmail = function (email,cb) {
        this.findAll({where : { email : email}}).then(cb);
    };

    User.prototype.getFullName = function () {
      return [this.last_name , this.first_name].join(' ');
    };

    User.prototype.comparePassword = function (password,cb) {
        bcrypt.compare(password,this.password,function (err, isMatch) {

            if(err) throw err;
            cb(null,isMatch);
        });
    }

    User.prototype.getCollaborations = function (collabs,cb) {
        var cols = [];
        var userId = this.id ;
        console.log("projects in collab size : " + collabs);
        collabs.forEach(function (col) {

            if(col.dataValues.userId.toString().localeCompare(userId.toString()) == 0 ) {

                cols.push(col);
            }
        });

        console.log("projects in collab size : " + cols.length);

        cb(cols);
    };

    User.prototype.removeUser = function (cb) {
           User.destroy({where : { id : this.id}}).then(cb);
    };

    User.prototype.connected = function (bool,cb) {
           this.update({isConnected : bool}).then(cb);
    };

    User.prototype.getOwnProjects = function (projects,cb) {
        var userId = this.id ;

        var userProjects = [] ;
        projects.forEach(function (project) {

            project.dataValues.creator.toString().localeCompare(userId.toString()) ?
                console.log("unequal") : userProjects.push(project) ;

            //console.log(userProjects.length);

        });

        console.log("users projects length : " + userProjects.length);
        cb(userProjects);
    };



    return User ;
};




