/**
 * Created by cloudStrife on 11/06/2017.
 */

//var seq = require('./sequelizeConnection');



module.exports = function (seq) {

    var Collaboration = seq.connection.define('collaboration',{

        userId : {
            type : seq.Sequelize.INTEGER ,
            allowNull : false
        },
        projectId : {
            type : seq.Sequelize.INTEGER ,
            allowNull : false
        },

        begin_date : {
            type : seq.Sequelize.DATE,
            allowNull : false
        },
        end_date : {
            type : seq.Sequelize.DATE
        },
        enabled : {
            type : seq.Sequelize.BOOLEAN,
            allowNull : false
        },
        color : {
            type : seq.Sequelize.STRING,
            allowNull : false
        },
        authorizationId : {
            type : seq.Sequelize.INTEGER ,
            allowNull : false
        }

    });



    Collaboration.newCollaboration = function (newCol,cb) {
      newCol.save().then(cb);
    };

    Collaboration.getCollaboration = function (projectId,userId,cb) {
        this.findOne({where : {projectId : projectId , userId : userId}}).then(cb);
    };

    Collaboration.allCollaborations = function (cb) {
           this.findAll().then(cb);
    };

    Collaboration.prototype.state = function (cb) {
        if(this.enabled)
            cb("enabled");
        else
            cb("disabled");
    };

    Collaboration.prototype.removeCollaboration = function (cb) {
        this.destroy().then(cb);
    };


    return Collaboration;

};

