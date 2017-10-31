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
var collaborationColor = document.getElementById('collaboration-color').innerText;
var linesReadonly = [] ;
var usersReadonly = [];
var editorSynchronized = false ;
var cursorIsInside = false ;
//var resourceType = null ;
var resourceId = window.href[4];




    // info_div.innerText =  ;
    const  editorAce = ace.edit("editor");
    editorAce.setTheme("ace/theme/default");
    const sessionAce = editorAce.getSession();
    //sessionAce.setMode("ace/mode/javascript");
    sessionAce.setNewLineMode("unix");
    const docAce = sessionAce.getDocument();

function editorTypeConfig(resourceType,session){
    if(resourceType == 'view')
        session.setMode("ace/mode/json");
    else if(resourceType == 'js')
        session.setMode('ace/mode/javascript')
    else if(resourceType == 'css')
        session.setMode('ace/mode/css');
}

    (function retrieveDocValueFromServer(docAce,docId) {
        $.ajax({
            url : '/getData/' + docId ,
            success : function (result,statut,xhr) {
                console.log('ajax result : ' + result);
                editorTypeConfig(result.type,sessionAce);
                docAce.setValue(result.content);
                //resourceType = result.type ;
                //console.log("session ace value : " + sessionAce.getValue());
            }
        });
    })(docAce,resourceId);


var Range = ace.require('ace/range').Range ;

function docId(){
    return resourceId ;
}

function append_messages_box(m,user,line) {

    console.log('user modifying : ' + user);
    console.log('line wooo : ' + line);
    //if(!mlis.includes(i) ){
        var childs = m.childNodes ;
        var exists = false ;
        var index = 0 ;

        for(var i = 0 ; i< childs.length ; i++){
            if(childs[i].innerText.split(' ')[0] == user) {
                exists = true;
                index = i;
                break;
            }
        }

        if(!exists) {
            var li = window.document.createElement("li");
            li.innerText = user + " is working on line " + line + "...";
            li.className = "messages-box-child";
            m.appendChild(li);
            console.log("appended");
        }
        else{
            var li = m.childNodes[index].innerText.split('.')[0] ;
            m.childNodes[index].innerText  = li + ', ' + line + "...";
            //exists = false ;
        }
        //mlis.push(i);
    //}
}

function remove_messages_box_childs(m) {
    //if(m.hasChildNodes()){
        for(var i = 0 ; i < m.childNodes.length ; i++)
            m.removeChild(m.childNodes[i]);
    //}
}

function addMarker(i,selector) {
    var range = new Range(i,0,i,Infinity);
    editorAce.session.addMarker(range, selector, "fullLine");
}

function stringToColorCode(str) {
    var color_codes = {};
    return (str in color_codes) ? color_codes[str] :
        (color_codes[str] = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6));
}

function addCSSRuleToMarker(sheet, selector,username, index) {

    var colorHash =new ColorHash();
    var hexColor = colorHash.hex(username);
    while (hexColor.toString() === '#000000')
            hexColor = colorHash.hex(username);

    var color = stringToColorCode(username).toString();
    //var rules = 'position:absolute; background:rgba('+ red + ','+ green +','+ blue + ',0.5); z-index:10' ;
    var rules = 'position:absolute; background:'+color+'; z-index:10' ;
    if("insertRule" in sheet) {
        console.log('insert rule');
        sheet.insertRule(selector + "{" + rules + "}", index);
    }
    else if("addRule" in sheet) {
        console.log('add rule');
        sheet.addRule(selector, rules, index);
    }
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

function synchronizeEditor() {

    const ShareAce = new sharedbAce(resourceId, {
        //WsUrl: "ws://localhost:3000/ws",
        WsUrl: 'ws://localhost:7000' ,
        pluginWsUrl: "ws://localhost:7000/ws",
        namespace: "codepad",
        user : {name : user , color : collaborationColor}
    });

    ShareAce.on('ready', function() {
        ShareAce.add(editorAce, ["code"], [
        ]);

        //ShareAce.add(editorAce,["code2"],[])
    });

    ShareAce.doc.on('before op',function (op,source) {
        console.log("doc data : " );
        var data = ShareAce.doc.data ;
        for(var prop in data)
            console.log(prop + " : "  + data[prop]);
    });

    ShareAce.doc.on('load',function () {
        var docId = ShareAce.doc.id ;
        //console.log(JSON.stringify(ShareAce.doc));
        console.log('ShareAce.doc loaded');
        socketEditor.emit("docSync",{user : user , doc : docId  });
    });

    editorSynchronized = true ;
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
}




    document.body.onkeydown = function (e) {
      console.log('keykeydown');
    };

    var socketEditor = io('/editor');

    socketEditor.on('connect',function () {
        socketEditor.emit('socketConnected',{user : user , doc : docId()});
    });

    editorAce.on('blur',function () {
        console.log("blur blur");
        socketEditor.emit('editorBlur',{user : user});
        cursorIsInside = false ;
    });

    editorAce.on('focus',function () {

        if(editorSynchronized) {
            if (linesReadonly.includes(editorAce.getCursorPosition().row)) {

                editorAce.blur();

                if (linesReadonly.includes(editorAce.getLastVisibleRow()))
                    docAce.insertNewLine({row: editorAce.getLastVisibleRow() + 1, column: 0});
            }
            else {
                socketEditor.emit('foc', {user: user,doc : docId()});
                console.log("focus emitted");
                cursorIsInside = true;
            }
        }
        else {
            editorAce.blur();
            swal({
                title : 'doc should be synchronized first' ,
                type : 'info' ,
                showCancelButton : false,
                confirmButtonText : 'OK'
            });
        }

    });


    window.onkeyup = function (e) {
        if(cursorIsInside) {

            console.log("keyupped");


                socketEditor.emit('operation', { doc : docId(), lineNumber: editorAce.getCursorPosition().row,
                    linesNumber: editorAce.getLastVisibleRow(), user: user
                });

            }

    };

    socketEditor.on('linesReadOnly',function (data) {
        console.log('linesReadOnly..........');
        //if(data.room == projectName()){
            console.log('linesReadOnly :' + data.linesReadonly);

                var markers = sessionAce.getMarkers(false);
                //var markersFront = session.getMarkers(true);
                console.log("back markers 1 : " + JSON.stringify(markers));

                while(m.hasChildNodes()) {
                    remove_messages_box_childs(m);
                }

                console.log(m.childNodes.length);
                linesReadonly = data.linesReadonly ;
                usersReadonly = data.usersReadonly;

                if(linesReadonly.includes(editorAce.getCursorPosition().row)) {
                    console.log('blur linesReadonly');
                    editorAce.blur();
                }

                remove_markers();

            console.log("back markers 2 : " + JSON.stringify(sessionAce.getMarkers()));

                for(var i = 0 ; i < linesReadonly.length ; i++) {

                    //console.log(usersReadonly[i]);
                    addMarker(linesReadonly[i], usersReadonly[i].split(':')[1].toString());
                    append_messages_box(m, usersReadonly[i].split(':')[0].toString() , linesReadonly[i]);
                }

        //}
        console.log(linesReadonly);
    });

    socketEditor.on('userHasSyncDoc',function (data) {
        $.notify("User " + data.user + " has syncronized this doc",
            {position: 'top center', showAnimation: 'slideDown', className : 'info'});
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
    usersReadonly = [] ;
    console.log("childnodes length : " + m.childNodes.length);
},6000);


    socketEditor.on('focUser',function (data) {
        console.log('user ' + data.user + ' is focusing on writing sth');
    });


    syncResource.onclick = function () {
      socketEditor.emit('editorSynchronized',{editorId : docId()});
    };

    socketEditor.on('sharedbDocCreated',function () {
        synchronizeEditor();
    });



$('#syncronized').on('outAnimationEnd.tlt', function () {
    // do something
    console.log('textilate');
    //$('#syncronized').textillate('stop');
    $('#syncronized').css('display','none');
});
