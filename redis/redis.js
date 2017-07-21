var redis = require('redis');
var redisClient = redis.createClient(6379,'localhost');
var flow = require('flow-maintained');




module.exports.client = redisClient ;

function createUser(username,docName,cb) {
    redisClient.incr('next:user:id',function (err,userId) {
       flow.exec(
           function () {
               var new_user = 'user:' + userId ;
               var user_string = 'user:' + userId ;
               redisClient.set(new_user,username,this.MULTI());
               redisClient.set('user:' + username,userId,this.MULTI());
               redisClient.zadd('rooms:' + roomName,Date.now(),username,this.MULTI());
               //redisClient.hset(user_string,'name',name,this.MULTI());
               //redisClient.hset(user_string,'username',username,this.MULTI());

           }, function (args) {
               cb(userId);
           }
       );
    });
}

module.exports.getUserId = function getUserId(username,roomName,cb) {
  redisClient.get('user:' + username , function (err,userid) {
     if(userid){
         cb(userid);
     }else {
         createUser(username,roomName,function (new_user) {
            cb(new_user);
         });
     }
  });
};

module.exports.EditText = function (txtValue,docId,cb) {

    flow.exec(
        function () {
            var doc_text = 'docs:' + docId + ':text' ;
            redisClient.set(doc_text,txtValue,this.MULTI());
            //redisClient.set(msg_id + ':user' , userid ,this.MULTI());
            //redisClient.lpush('messages',id,this.MULTI());
        },function () {
            cb();
        }
    );

};

module.exports.getText = function getText(docId,cb) {
    redisClient.get('docs:' + docId + ':text',function (err,text) {
        //console.log(text + " : getText");

        cb(err,{docId : docId , text : text });

    });
};

module.exports.getRoomUsers = function getRoomUsers(roomName,cb) {
    flow.exec(
        function () {
            redisClient.zrange('rooms:' + roomName,0,-1,this);
        },function (err,users) {
            //var final_users = [];
            cb(users);
        }
            //, function (mess) {
             //   final_messages.push(mess);
            //}, function () {
            //    cb(final_messages);
            //}
            );
};







module.exports.getMessages= function (cb) {
    flow.exec(
        function () {
          redisClient.lrange('messages',0,-1,this);
        },function (err,messages) {
            var final_messages = [];
            flow.serialForEach(messages, function (el) {
                module.exports.fetchMessage(el, this);
            }, function (mess) {
                final_messages.push(mess);
            }, function () {
                cb(final_messages);
            });
        }
    );
};
