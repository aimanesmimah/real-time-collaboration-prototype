/**
 * Created by cloudStrife on 03/07/2017.
 */
var flow = require('flow-maintained');
var Scheduler = require("redis-scheduler");
var scheduler = new Scheduler({host : 'localhost' , port : 6379});


function eventTriggered(err,key) {
    if(err)
        throw err ;

    //console.log('event triggered key : ' + key);
    var docId = key.split(':')[1] ;
    var client = require('redis').createClient({host : 'localhost' , port : 6379});

    flow.exec(
        function () {
            client.zrem('activeDocs',docId,this.MULTI());
        },function () {

        }
    );
}


module.exports.addNewOperation = function addNewOperation(client,operation,cb) {

    var action = null ;
    if(operation.op[0].si)
        action = 'insert' ;
    else
        action = 'remove' ;

    client.select(0);
    client.incr('op:next:id',function (err,opId) {
        if(err)
            throw err;
        flow.exec(
            function (){
                var operation_string = 'operation:' + opId ;

                client.hset(operation_string,'startRow',operation.op[0].start.row,this.MULTI());
                client.hset(operation_string,'startColumn',operation.op[0].start.column,this.MULTI());
                client.hset(operation_string,'endRow',operation.op[0].end.row,this.MULTI());
                client.hset(operation_string,'endColumn',operation.op[0].end.column,this.MULTI());
                client.hset(operation_string,'action',action,this.MULTI());
                client.hset(operation_string,'line',action == 'insert' ? operation.op[0].si : operation.op[0].sd,this.MULTI());
                client.hset(operation_string,'doc',operation.d,this.MULTI());
                if(operation.op[0].user != null) {
                    client.hset(operation_string,'user',operation.op[0].user.name,this.MULTI());
                    var user_string = 'user:' + operation.op[0].user.name + ':OpsNbr' ;
                    client.incr(user_string,this.MULTI());

                }
                else
                    client.hset(operation_string, 'user', 'noUser', this.MULTI());
            },function (){
                cb(opId)
            }
        );
    });
};

function setActiveDocs(client,doc) {
   client.hset('activeDocs',doc,'active',function () {

   });
};

module.exports.setLinesReadonly = function getLinesReadOnly(client,operation,cb) {
    client.select(0);
    var doc = operation.d ;
    var readOnlyLinesList = 'readonlyLines:' + doc ;
    client.del(readOnlyLinesList,function () {
        console.log("deleted");

        for(var i= 0 ; i<= operation.op[0].docLines ; i++){

            client.get('doc:' + doc + ':line:' + i + ':readonly',function (err,lineState) {

                if(lineState == 'exists') {
                    console.log('line' + i);
                    client.rpush(readOnlyLinesList,i);

                }
            });

        }
    });



    cb("ok");
};

module.exports.updateLinesState = function updateLinesState(client,operation,cb) {
    client.select(0);
    flow.exec(
        function () {

            var doc = operation.d ;
            var linesStateString = 'linesStateList:' + doc;


            for(var i = 0 ; i <= operation.op[0].docLines ; i++){
                console.log(i);
                var exists = null ;
                client.get('doc:' + doc + ':line:' + i + ':readonly',function (err,lineState) {

                    console.log(lineState);
                    if(lineState) {
                        console.log("dkhal");
                        client.zscore(linesStateString,i,function (err,score) {
                            console.log('score :' + score);
                            if(!score)
                                client.zadd(linesStateString, 1,i);
                            if(score == 0)
                                client.zincrby(linesStateString,1,i);

                        });
                    }
                    else {
                        console.log('dkhaaal');
                        client.zscore(linesStateString,i,function (err,score) {
                            console.log('score :' + score);
                            if(!score)
                                client.zadd(linesStateString, 0,i);
                            if(score == 1)
                                client.zincrby(linesStateString,-1,i);

                        });
                    }
                });


            }
        },
     function (args) {
         cb();
     }
    );
};

module.exports.setLine = function setLine(client,operation,cb){

    client.select(0);
    flow.exec(
        function () {
            //var new_user = 'user:' + userId ;


            if(operation.op[0].si != "\n" || operation.op[0].sd) {
                if (operation.op[0].start.row == operation.op[0].end.row) {
                    client.set('doc:' + operation.d + ":line:" + operation.op[0].start.row + ':text',
                        operation.op[0].currentLine, this.MULTI());
                    client.set('doc:' + operation.d + ":value" , operation.op[0].currentValue,this.MULTI());
                    //client.setex('doc:' + operation.d + ":line:" + operation.op[0].start.row + ':readonly',20, "exists", this.MULTI());
                    client.zadd('activeDocs',operation.op[0].docLines,operation.d,this.MULTI());
                    client.hset('doc:' + operation.d + ":line:" + operation.op[0].start.row + ':readonly','user',operation.op[0].user.name, this.MULTI());
                    client.hset('doc:' + operation.d + ":line:" + operation.op[0].start.row + ':readonly','color',operation.op[0].user.color, this.MULTI());
                    scheduler.schedule({key : 'doc:' + operation.d + ":line:" + operation.op[0].start.row + ':readonly', expire : 20000,
                        handler : eventTriggered  },function (err) {
                        console.log(err);
                    });
                }
                else {
                    var array = [];
                    var j = 0;
                    if(operation.op[0].si) {
                        array = operation.op[0].si.split('\n');
                        client.set('doc:' + operation.d + ":value" , operation.op[0].currentValue,this.MULTI());
                        client.zadd('activeDocs',operation.op[0].docLines,operation.d,this.MULTI());
                        for (var i = operation.op[0].start.row; i <= operation.op[0].end.row; i++) {
                            client.set('doc:' + operation.d + ":line:" + i + ':text', array[j], this.MULTI());
                            //client.setex('doc:' + operation.d + ":line:" + i + ':readonly',20,"exists",this.MULTI());

                            client.hset('doc:' + operation.d + ":line:" + i + ':readonly','user',operation.op[0].user.name, this.MULTI());
                            client.hset('doc:' + operation.d + ":line:" + i + ':readonly','color',operation.op[0].user.color, this.MULTI());
                            scheduler.schedule({key : 'doc:' + operation.d + ":line:" + i + ':readonly',
                                expire : 20000, handler : eventTriggered  },function (err) {
                                console.log(err);
                            });

                            j++;
                        }
                    }
                    else {
                        array = operation.op[0].sd.split('\n');
                        client.zadd('activeDocs',operation.op[0].docLines,operation.d,this.MULTI());
                        client.set('doc:' + operation.d + ":value" , operation.op[0].currentValue,this.MULTI());
                        for(var i = operation.op[0].start.row ; i <= operation.op[0].end.row ; i++){
                               var text = client.get('doc:' + operation.d + ':line:' + i + ':text',this.MULTI());
                                //var textReplaced = replaceAll(array[j],"",text);
                                client.set('doc:' + operation.d + ":line:" + i + ':text',"", this.MULTI() );
                                //client.setex('doc:' + operation.d + ":line:" + i + ':readonly',20,"exists",this.MULTI());

                            client.hset('doc:' + operation.d + ":line:" + i + ':readonly','user',operation.op[0].user.name, this.MULTI());
                            client.hset('doc:' + operation.d + ":line:" + i + ':readonly','color',operation.op[0].user.color, this.MULTI());
                                scheduler.schedule({key : 'doc:' + operation.d + ":line:" + i + ':readonly',
                                    expire : 20000, handler : eventTriggered  },function (err) {
                                    console.log(err);
                                });
                                j++;

                        }
                    }
                }
            }


           // client.setex('doc:' + docId + ":line:" + lineId + ':readOnly',30,true,this.MULTI());

        }, function (args) {
            cb();
        }
    );
};

module.exports.getLineState = function getLineState(client,docId,lineId,cb) {
    client.select(0);
    client.hget('doc:' + docId + ':line:' + lineId + ':readonly','user',function (err,user) {
         client.hget('doc:' + docId + ':line:' + lineId + ':readonly','color',function (err,color) {
             cb(err,user,color);
         });

    });
};

module.exports.getLineText = function getLineText(client,docId,lineId,cb) {
    client.select(0);
    client.get('doc:' + docId + ':line:' + lineId + ':text',function (err,lineText) {
        cb(err,lineText);
    });
};

module.exports.getDocText = function getDocText(client,docId,cb) {
  client.select(0);
  client.get('doc:' + docId + ':value',function (err,docText) {
      cb(err,docText);
  });
};

module.exports.getActiveDocs =function (client,cb) {
       client.select(0);

       client.zrange('activeDocs',0,-1,'withscores',function (err,activeDocs) {
           cb(err,activeDocs);
       });
};

module.exports.setConnectedUsers = function (client,action,projet,username) {
    var connected_string = 'project:' + projet + ':connectedUsers' ;
  if(action === 'remove'){
      client.lrem(connected_string,username,function () {
          console.log('connected user removed');
      });
  }
  else if(action === 'add'){
      client.lpush(connected_string,username,function () {
          console.log('user added to connected users');
      });
  }
  else{
      throw new Error();
  }
};

module.exports.getConnectedUsers = function (client,cb) {
    client.select(0);

    cient.lrange('connectedUsers',0,-1,function (err,connectedUsers) {
        cb(err,connectedUsers);
    });
};