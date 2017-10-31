/**
 * Created by cloudStrife on 22/07/2017.
 */

var asyncLoop = require('node-async-loop');
var seq = require('../models/sequelizeConnection');
var Document = require('../models/document')(seq);
//var redisFunctions = require('../redis/redisFunctions');

module.exports = function (client,redisFunctions) {
    var persistDataInMySQL = setInterval(function () {
        console.log('mysql storage executed');
        redisFunctions.getActiveDocs(client,function (err,activeDocs) {

            var activeDocsWithLines = [];

            if(activeDocs.length) {
                for (var i = 0; i < activeDocs.length; i += 2)
                    activeDocsWithLines.push(activeDocs[i] + ':' + activeDocs[i + 1]);

                asyncLoop(activeDocsWithLines,function (item,next) {
                    var itemArray = item.split(':');
                    var activeDoc = itemArray[0];

                    redisFunctions.getDocText(client, activeDoc, function (err, docText) {
                        Document.getDocById(activeDoc, function (doc) {
                            doc.updateContent(docText, function () {
                                console.log("doc :" + activeDoc + " updated");
                                next();
                            });
                        });
                    });
                },function (err) {
                    if (err)
                        return;
                    console.log('mysql storage done');
                });

                /*asyncLoop(activeDocsWithLines, function (item, next) {
                    var docString = "";
                    var itemArray = item.split(':');
                    var activeDoc = itemArray[0];
                    var arrayLines = [];
                    var lines = itemArray[1];
                    for (var i = 0; i <= lines; i++)
                        arrayLines.push(i);

                    asyncLoop(arrayLines, function (item, next) {
                        redisFunctions.getLineText(client, activeDoc, item, function (err, lineText) {
                            console.log('line text my sql : ' + lineText);
                            if(lineText != null)
                                docString += lineText + "\n";
                            next();
                        });
                    }, function (err) {
                        if (err)
                            return;
                        console.log(docString);
                        //persist content in DB
                        console.log('activeDocs : ' + activeDoc);
                        Document.getDocById(activeDoc, function (doc) {
                            doc.updateContent(docString, function () {
                                console.log("doc :" + activeDoc + " updated");
                                next();
                            });
                        });
                    });

                }, function (err) {
                    if (err)
                        return;
                    console.log('mysql storage done');
                });*/
            }
        });
    },10000);
};

