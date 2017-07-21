/**
 * Created by cloudStrife on 26/06/2017.
 */

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);

    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}



import sharedbAce from "sharedb-ace/distribution/sharedb-ace";

var syncResource = document.getElementById('syncResource_btn');
var m = window.document.getElementById('messages-box');
var linesReadonly = [] ;

//syncResource.style.visibility = 'hidden' ;

console.log("dom variable : " + user + " " + projectName());
console.log(socket);
console.log(info_div.innerText);


    editor.style.display = "inline" ;
    no_edit.style.display = "none" ;

    // info_div.innerText =  ;
    const  editorAce = ace.edit("editor");
    editorAce.setTheme("ace/theme/twilight");
    const sessionAce = editorAce.getSession();
    sessionAce.setMode("ace/mode/javascript");
    sessionAce.setNewLineMode("unix");
    const docAce = sessionAce.getDocument();

    $.ajax({
        url : '/getData/' + window.href[4] ,
        success : function (result,statut,xhr) {
            console.log('ajax result : ' + result);
            docAce.setValue(result);
        }
    });


var Range = ace.require('ace/range').Range ;

function append_messages_box(m,user,i) {

    console.log(m.childNodes.length);
    //if(!mlis.includes(i) ){

        var li = window.document.createElement("li");
        li.innerText = user + " is working on line " + i + "..." ;
        li.className  = "messages-box-child" ;
        m.appendChild(li);
        console.log("appended");
        //mlis.push(i);
    //}
}


function remove_messages_box_childs(m) {
    //if(m.hasChildNodes()){
        for(var i = 0 ; i < m.childNodes.length ; i++)
            m.removeChild(m.childNodes[i]);
    //}
}

function addMarker(i) {
    var range = new Range(i,0,i,Infinity);
    editorAce.session.addMarker(range, "myMarker", "fullLine");
}

function remove_markers() {
    var markersBack = sessionAce.getMarkers(false);
    //var markersFront = session.getMarkers(true);

    for(var marker in markersBack) {
        sessionAce.removeMarker(marker);
    }

    //for(var marker in markersFront)
    //    session.removeMarker(marker);

}

function objectIsEmpty(obj) {
    return Object.getOwnPropertyNames(obj).length === 0 ;
}

//var room = getParameterByName('room');
//var user = getParameterByName('user');
//var u = getParameterByName('u');



    window.onload = function () {
        //window.history.forward();
        socket.emit('editorId',{editorId : user});
    };

    document.body.onkeydown = function (e) {
      console.log('keykeydown');
    };

    var cursorIsInside = false ;
    editorAce.on('blur',function () {
        console.log("blur blur");
        socket.emit('editorBlur',{user : user});
        cursorIsInside = false ;
    });

    editorAce.on('focus',function () {



        if(linesReadonly.includes(editorAce.getCursorPosition().row)) {

            editorAce.blur();

            if(linesReadonly.includes(editorAce.getLastVisibleRow()))
                docAce.insertNewLine({row : editorAce.getLastVisibleRow() + 1 , column :0});
        }
        else {
            socket.emit('foc', {user: user});
            console.log("focus emitted");
            cursorIsInside = true;
        }
    });


    window.onkeyup = function (e) {
        if(cursorIsInside) {

            console.log("keyupped");


                socket.emit('operation', { room: projectName(), lineNumber: editorAce.getCursorPosition().row,
                    linesNumber: editorAce.getLastVisibleRow(), user: user
                });

            }

    };

    socket.on('linesReadOnly',function (data) {
        console.log('linesReadOnly..........');
        if(data.room == projectName()){
            console.log('linesReadOnly :' + data.linesReadonly);

                var markers = sessionAce.getMarkers(false);
                //var markersFront = session.getMarkers(true);
                console.log("back markers 1 : " + JSON.stringify(markers));



                while(m.hasChildNodes()) {
                    remove_messages_box_childs(m);
                }

                console.log(m.childNodes.length);
                linesReadonly = data.linesReadonly ;

                if(linesReadonly.includes(editorAce.getCursorPosition().row)) {
                    console.log('blur linesReadonly');
                    editorAce.blur();
                }

                remove_markers();

            console.log("back markers 2 : " + JSON.stringify(sessionAce.getMarkers()));

                for(var i = 0 ; i < linesReadonly.length ; i++) {
                    //console.log(i);
                    addMarker(linesReadonly[i]);
                    append_messages_box(m, user, linesReadonly[i]);
                }

        }
        console.log(linesReadonly);
    });


setInterval(function () {
    var markersArray = sessionAce.getMarkers(false) ;

    //while (markersArray.length > 0) {
        //console.log('console');
        while (!objectIsEmpty(markersArray))
            remove_markers();
    //}
    while (m.hasChildNodes()) {
        remove_messages_box_childs(m);
    }

    linesReadonly = [];
    console.log("childnodes length : " + m.childNodes.length);
},6000);


    socket.on('focUser',function (data) {
        console.log('user ' + data.user + ' is focusing on writing sth');
    });

    syncResource.onclick = function () {
        const ShareAce = new sharedbAce('editor', {
         //WsUrl: "ws://localhost:3000/ws",
         WsUrl: 'ws://' + window.location.host,
         pluginWsUrl: "ws://localhost:8000/ws",
         namespace: "codepad",
         user : user
         });

         ShareAce.on('ready', function() {
         ShareAce.add(editorAce, ["code"], [
         //Do add any plugins for now
         // SharedbAceRWControl,
         // SharedbAceMultipleCursors
         ]);
         // ShareAce.add(editor2, ["testcases"], []);
         });
        syncResource.style.display = 'none' ;
        $('#syncronized').css('display','inline');
        $('#syncronized').textillate({
            in: { effect: 'rotateIn' , sync : false } ,
            out : { effect : 'bounceOut' ,  callback : function () {

            }} ,
            minDisplayTime: 1000,
            loop : true,
            callback : function () {

            }
        });
    };

$('#syncronized').on('outAnimationEnd.tlt', function () {
    // do something
    console.log('textilate');
    //$('#syncronized').textillate('stop');
    $('#syncronized').css('display','none');
});
