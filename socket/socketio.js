/**
 * Created by cloudStrife on 22/07/2017.
 */
var asyncLoop  = require('node-async-loop');
var seq = require('../models/sequelizeConnection');
var Document = require('../models/document')(seq);
//var redisFunctions = require('../redis/redisFunctions');


module.exports = function (io,sharePS,connection,redisFunctions) {

    // Create initial document then fire callback
    function createDoc(connection,id) {
        //var connection = backend.connect();
        var doc = connection.get("codepad", id);
        doc.fetch(function(err) {
            if (err) throw err;
            if (doc.type === null) {
                Document.getDocById(id,function (document) {
                    document.content != null ? doc.create({"code":  document.content.toString()}) : doc.create({"code" : ""});
                    console.log('doc created');
                });


            }

            return;

        });
    }

    //socket stuff
    io.of('/editor').on('connection',function (socketio) {
        //console.log('a user connected');
        console.log(socketio.id);

        socketio.on('socketConnected',function (data) {
            socketio.join(data.doc);
        });

        socketio.on('editorSynchronized',function (data) {
            createDoc(connection,data.editorId);
            io.of('/editor').connected[socketio.id].emit('sharedbDocCreated');
        });

        socketio.on('docSync',function (data) {
            socketio.broadcast.to(data.doc).emit('userHasSyncDoc',{user : data.user });
        });

        /*socketio.on('editorId',function (data) {
            //createDoc(connection,data.editorId);
            createDoc(connection,'editor');
        });*/

        socketio.on('editorBlur',function (data) {
            console.log('user blur : ' + data.user);
        });

        socketio.on('foc',function (data) {
            console.log('user ' + data.user + ' is focusing on writing');


            console.log("subscribed : " + JSON.stringify(sharePS.subscribed));
            //console.log("client : " + JSON.stringify(sharePS.client));
            //io.sockets.connected[socketio.id].emit('my message');
            socketio.broadcast.to(data.doc).emit('focUser',{user : data.user});
        });

        socketio.on('operation',function (data) {
            //console.log("operation :" + JSON.stringify(data.operation));
            console.log("socket on message");
            console.log("data :" + JSON.stringify(data));
            console.log("oppopopop sending.....");
            var linesReadOnly = [];
            var usersReadonly = [];
            var loopArray = [];
            for(var i = 0 ; i <= data.linesNumber ; i++){
                loopArray.push(i);
            }

            asyncLoop(loopArray,function (item,next) {
                redisFunctions.getLineState(sharePS.client,data.doc,item,function (err,userLine,colorLine) {
                    if(userLine != null && colorLine != null) {
                        linesReadOnly.push(item);
                        usersReadonly.push(userLine +':' + colorLine);

                    }

                    next();
                });
            }, function (err) {
                if(err){
                    console.log('Error : ' + err.message);
                    return;
                }

                console.log("finished");
                console.log(linesReadOnly);
                socketio.broadcast.to(data.doc).emit('linesReadOnly',{linesReadonly : linesReadOnly , usersReadonly : usersReadonly});
            });

            /*sharePS.publish("linesProcess",data,function () {

             });*/
        });

    });

    io.of('/mouse').on('connection',function (socketio) {
        socketio.on('socketConnected',function (data) {
            socketio.join(data.project);
        });
        
        socketio.on('mouse-activity',function (data) {
            //console.log(data);
            var coords = { x : data.x , y : data.y};
            socketio.broadcast.to(data.project).emit('all-mouse-activity',{sessionId : data.user , user : data.user,
                coords : coords  });
        });
    });

    io.of('/notifications').on('connection',function (socketio) {
        socketio.on('socketConnected',function (data) {
            socketio.join(data.project);

        });

        socketio.on('user',function (data) {
            socketio.username = data.user ;
            socketio.broadcast.to(data.project).emit('new',{user : data.user , project : data.project});
        });
        //socket.broadcast.emit('connect',{})
        socketio.on('userQuit',function (data) {

            console.log('one user quit');
            //console.log(socket);

            socketio.broadcast.to(data.project).emit('userHasQuit',{user : data.user , project : data.project});
        });

        socketio.on('colAdded',function (data) {
            console.log(data.user);
            socketio.broadcast.to(data.project).emit('newCol',{user : data.user , project : data.project });
        });
    });

    io.of('/chat').on('connection',function (socketio) {
        socketio.on('userConnected',function (data) {
            socketio.join(data.project);
            redisFunctions.setConnectedUsers(sharePS.client,'add',data.projectId,data.user);
            socketio.broadcast.to(data.project).emit('newUser',{user : data.user });
        });
    });
};
