/**
 * Created by cloudStrife on 12/06/2017.
 */


module.exports = function (seq) {

    var Auth_doc = seq.connection.define('auth_doc',{

        authId : {
            type : seq.Sequelize.INTEGER ,
            allowNull : false
        },
        docId : {
            type : seq.Sequelize.INTEGER,
            allowNull : false
        }
    });


    Auth_doc.addNewAuth_doc = function (newAuth_doc,cb) {
        newAuth_doc.save().then(cb);
    };

    Auth_doc.allAuth_docs  = function (cb) {
      this.findAll().then(cb);
    };

    return Auth_doc ;
};
