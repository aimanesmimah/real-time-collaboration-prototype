/**
 * Created by cloudStrife on 11/06/2017.
 */

//var seq = require('./sequelizeConnection');

module.exports = function (seq) {
    var Document = seq.connection.define('document',{
        name : {
            type : seq.Sequelize.STRING,
            allowNull : false

        },
        type : {
            type : seq.Sequelize.STRING,
            allowNull : false
        },
        content : {
            type : seq.Sequelize.TEXT
        },

        projectId : {
            type : seq.Sequelize.INTEGER ,
            allowNull : false
        }

    });

    Document.addNewDoc = function (newDoc,cb) {
      newDoc.save().then(cb);
    };

    Document.getDocById = function (id,cb) {
       this.findById(id).then(cb);
    };

    Document.searchDocument = function (name,cb) {
        this.findOne({where : { name : name}}).then(cb);
    };

    Document.getAllDocs = function (cb) {
        this.findAll().then(cb);
    };
    
    Document.prototype.updateContent = function (content,cb) {
        this.update({content : content}).then(cb);
    };

    Document.prototype.updateAuth = function (authId,cb) {
      this.update({authorizationId : authId}).then(cb);
    };

    Document.prototype.removeDoc = function (cb) {
        this.destroy().then(cb);
    }

    return Document;
};


