/**
 * Created by cloudStrife on 11/06/2017.
 */

var seq = require('./sequelizeConnection');
var Document = require('./document')(seq);
var User = require('./user')(seq);


module.exports = function (seq) {
    var Project = seq.connection.define('project',{
        name : {
            type : seq.Sequelize.STRING,
            allowNull : false,
            unique : true
        },
        description : {
            type : seq.Sequelize.STRING

        },

        creator : {
            type : seq.Sequelize.INTEGER,
            allowNull : false
        }

    });


    Project.searchProject = function (name,cb) {
        this.findOne({where : { name : name}}).then(cb);
    };

    Project.addNewProject = function (newProject,cb) {
        newProject.save().then(cb);
    };

    Project.getProjectById = function (id,cb) {
      this.findById(id).then(cb);
    };

    Project.allProjects = function (cb) {
      this.findAll().then(cb);
    };

    Project.prototype.getDocs = function (cb) {
        var projId = this.id ;
        Document.getAllDocs(function (docs) {


            var projectDocs = [];
            if(docs) {

                docs.forEach(function (doc) {
                    doc.dataValues.projectId.toString() === projId.toString() ? projectDocs.push(doc) : console.log("unequal") ;
                });
            }
            cb(projectDocs);
        });
    };

    Project.prototype.getCollaborators = function (collaborations,cb) {
        var colls = [] ;

        var projId = this.id ;

        collaborations.forEach(function (coll) {

            if(coll.dataValues.projectId.toString().localeCompare(projId.toString()) == 0) {
                console.log("dkhal")
                User.getUserById(coll.dataValues.userId,function (user) {


                    console.log('daaz');
                    colls.push(user);
                });
            }

        });
        //console.log(colls);
        cb(colls);
    };

    return Project
};


