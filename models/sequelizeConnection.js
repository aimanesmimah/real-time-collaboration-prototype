/**
 * Created by cloudStrife on 10/06/2017.
 */

var Sequelize = require('sequelize');

var connection  = new Sequelize('collaborationProject','root','dasrisiko518',{
    dialect : 'mysql' ,
    host : 'localhost' ,
    port : 3305
});

module.exports.connection = connection ;
module.exports.Sequelize = Sequelize ;
