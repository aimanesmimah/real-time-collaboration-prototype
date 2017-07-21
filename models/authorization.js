/**
 * Created by cloudStrife on 11/06/2017.
 */

//var seq = require('./sequelizeConnection');



module.exports = function (seq) {

    var Authorization = seq.connection.define('authorization',{

        addNewDoc : {
            type : seq.Sequelize.BOOLEAN,
            allowNull : false
        },
        removeDoc : {
            type : seq.Sequelize.BOOLEAN,
            allowNull : false
        }

    });



    Authorization.addAuthorization = function (newAuth,cb) {
        newAuth.save().then(cb);
    };

    Authorization.getAuthById = function (id,cb) {
      this.findById(id).then(cb);
    };

    Authorization.allAuths = function (cb) {
      this.findAll().then(cb);
    };

    Authorization.prototype.getAllowedDocs = function (auths_docs,cb) {
        var authId = this.id ;
        var docsAllowed = [];

        auths_docs.forEach(function (auth_doc) {
            if(auth_doc.authId === authId)
                docsAllowed.push(auth_doc.docId);
        });

        cb(docsAllowed);
    };

    Authorization.prototype.removeAuth = function (cb) {
        this.destroy().then(cb);
    };

    return Authorization ;
};


