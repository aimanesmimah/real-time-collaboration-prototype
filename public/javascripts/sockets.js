/**
 * Created by cloudStrife on 24/08/2017.
 */
var socketNotifs = io('/notifications');
var socketChat = io('/chat');
var socketMouse = io('/mouse');


var docs_box_clicked = false ;
var leave_btn_clicked = false ;
var logout_btn_clicked = false ;

socketMouse.on('connect',function () {
    socketMouse.emit('socketConnected',{user : user , project : projectName()})
});

$(document).on('mousemove',function (event) {
    socketMouse.emit('mouse-activity',{x: event.pageX , y : event.pageY ,
        user : user , project : projectName()});
});

socketMouse.on('all-mouse-activity',function (data) {
    console.log(data.user);
    //if(projectName() === data.project) {
    if ($('.pointer[session_id="' + data.sessionId + '"]').length <= 0) {
        console.log('dkhooool');
        $('body').append('<div class="pointer"  session_id="' + data.sessionId + '"><p>' + data.sessionId + '</p></div>');
    }

    var $pointer = $('.pointer[session_id="' + data.sessionId + '"]');

    //$pointer.css('display','inline');
    $pointer.css('left', data.coords.x);
    $pointer.css('top', data.coords.y);

    //  }
});

socketNotifs.on('connect',function () {
    socketNotifs.emit('socketConnected',{user : user , project : projectName()});
    console.log("connected");
    if(window.href[3] !== 'getDoc')
        socketNotifs.emit('user',{user : user , project : projectName()});
});

socketNotifs.on('new',function (data) {
    //if(projectName() === data.project)
    $.notify("User " + data.user + " has joined", {position: 'top center', showAnimation: 'slideDown',
        className : 'info'});

});

socketNotifs.on('newCol',function (data) {
    //if(projectName() === data.project)
    $.notify("User " + data.user + " has been added to the collaboration", {position: 'top center', showAnimation: 'slideDown',
        className : 'info'});
});

docs_box.onclick = function () {
    docs_box_clicked = true ;
};

window.onunload = function () {

    if(!docs_box_clicked && !leave_btn_clicked && !logout_btn_clicked) {
        socketNotifs.emit('userQuit', {user: user, project: projectName()});
        socketChat.emit('userDisconnected',{user:user,projectId:projectId()});
    }
};

logout.onclick = function () {
    logout_btn_clicked = true ;
    socketNotifs.emit('userQuit',{user:user, project : projectName()});
    socketChat.emit('userDisconnected',{user : user ,projectId : projectId()})
};

leave_project.onclick = function () {
    leave_btn_clicked = true ;
    socketNotifs.emit('userQuit',{user:user , project : projectName()});
    socketChat.emit('userDisconnected',{user : user , projectId : projectId()});
};

socketNotifs.on('userHasQuit',function (data) {
    //if(projectName() === data.project) {
    console.log('disconnected');
    $.notify("User " + data.user + " has quiet",{position: 'top center', showAnimation: 'slideDown',
        className : 'info'});
    var $pointer = $('.pointer[session_id="' + data.user + '"]');
    $pointer.remove();
    //}
});

socketChat.on('connect',function () {
    if(href[3] === "project")
        socketChat.emit('userConnected',{user : user,projectId : projectId(),project : projectName()});
});

socketChat.on('newUser',function (data) {

});