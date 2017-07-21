var express = require('express');
var router = express.Router();

var seq = require('../models/sequelizeConnection');
var User = require('../models/user')(seq);
var Project  = require('../models/project')(seq);
var Auth = require('../models/authorization')(seq);
var Col = require('../models/collaboration')(seq);
var Document = require('../models/document')(seq);
var Auth_Doc = require('../models/auth_doc')(seq);
var redisConfig = require('../redis/redis');

/* GET home page. */
router.get('/', function(req, res, next) {

    if(res.locals.utilisateur !== null) {


        console.log(res.locals.utilisateur.id);
        console.log(req.session);
        Project.allProjects(function (projects) {

            Col.allCollaborations(function (cols) {


                res.locals.utilisateur.getCollaborations(cols,function (collabs) {
                    var projs = [];
                    collabs.forEach(function (col) {
                        Project.getProjectById(col.dataValues.projectId,function (pr) {

                            projs.push(pr);
                        });
                    });

                    res.locals.utilisateur.getOwnProjects(projects,function (userProjects) {
                        console.log("user projects length : " + userProjects.length);
                        if (userProjects && userProjects.length > 0) {

                            res.render('index', { title: 'ScreenDy' , projects : userProjects , projectsInCollabs : projs});
                        }
                        else{
                            res.render('index', { title: 'ScreenDy' , projects : userProjects , projectsInCollabs: projs});
                        }
                    });


                });
            });

        });

    }
});

router.post('/project',function (req,res,next) {

    console.log(res.locals.utilisateur);
    console.log(req.session);
    var name = req.body.projectName ;
    console.log(name);

    Project.searchProject(name,function (projet) {


        console.log("nodemon. started....");
        console.log(projet.description);
        projet.getDocs(function (docs) {
            console.log("docs" + docs.length);
            Col.allCollaborations(function (collabs) {


                console.log(collabs.length);
                projet.getCollaborators(collabs,function (colls) {
                    console.log(colls.length);
                    User.getUserById(projet.creator,function (creator) {


                        var isCreator = creator.dataValues.id.toString() === res.locals.utilisateur.dataValues.id.toString();

                        Col.getCollaboration(projet.dataValues.id,res.locals.utilisateur.dataValues.id,function (col) {


                            console.log('col : ' + col.dataValues.id);
                            Auth.getAuthById(col.dataValues.authorizationId,function (auth) {


                                colls.forEach(function (col) {
                                    if(col.dataValues.id.toString() === creator.dataValues.id.toString())
                                        colls.splice(colls.indexOf(col),1);
                                });

                                res.render('project',{title : 'ScreenDy' , project : projet, col : col, auth : auth ,
                                    creator : creator , docs : docs , colls : colls , isCreator: isCreator });

                            });

                        });

                    });

                });
            });

        });

    });
    //res.render('index',{t})

});

router.get('/getDoc/:id',function (req,res,next) {
    var id = req.params.id ;
    console.log(id);

    Document.getDocById(id,function (doc) {


        Project.getProjectById(doc.dataValues.projectId,function (projet) {


            projet.getDocs(function (docs) {
                Col.allCollaborations(function (collabs) {

                    User.getUserById(projet.dataValues.creator,function (creator) {


                        projet.getCollaborators(collabs,function (colls) {
                            console.log(creator.dataValues.id);
                            var isCreator = creator.dataValues.id.toString() === res.locals.utilisateur.dataValues.id.toString();

                            Col.getCollaboration(projet.dataValues.id,res.locals.utilisateur.dataValues.id,function (col) {


                                //console.log('col : ' + col._id);
                                Auth.getAuthById(col.dataValues.authorizationId, function ( auth) {


                                    colls.forEach(function (col) {
                                        if (col.dataValues.id.toString() === creator.dataValues.id.toString())
                                            colls.splice(colls.indexOf(col), 1);
                                    });

                                    res.render('project', {title: 'ScreenDy', project: projet, col : col , auth : auth ,
                                        creator : creator, docs: docs, colls: colls, doc: doc, isCreator : isCreator});
                                });
                            });
                        });
                    });

                });
            });
        });


    });
});

router.get('/saveData/:id',function (req,res,next) {
    Document.getDocById(req.params.id,function (doc) {


        redisConfig.getText(req.params.id,function (err,result) {
            if(err)
                throw err ;

            doc.updateContent(result.text,function () {
                console.log('doc updated');
            });
        });

    });
});

router.get('/getData/:id',function (req,res,next) {

    console.log('ajax server dkhaal');
    /*redisConfig.getText(req.params.id,function (err,result) {
     if(err)
     throw err;

     console.log(result.text);
     res.send(result);
     });*/
    Document.getDocById(req.params.id,function (doc) {
        res.send(doc.content);
    });

});

router.get('/changeDocState/:id',function (req,res,next) {

    console.log(req.params.id);
    if(res.locals.docState)
        res.locals.docState = false;
    else
        res.locals.docState = true;

    res.send(res.locals.docState);
});

router.get('/syncAll',function (req,res,next) {
    seq.connection.sync({
        force : true,
        logging : console.log
    }).then(function () {
        console.log('tables created');
    }).catch(function (error) {
        console.log("error caught : " + error);
    });

    res.render('index',{title : 'express'});
});

router.get('/getUsers',function (req,res,next) {

    User.allUsers(function (users) {


        res.send(users);
    });

});

router.post('/saveCollaborationData',function (req,res,next) {
    console.log('dkhaal00');

    console.log('dkhaal0');

    var data = {};
    for(var prop in req.body){
        data = JSON.parse(prop);
        break;
    }

    console.log(data);
    console.log(data.projectName);
    //console.log(req.body['projectName']);
    //console.log(req.body.user);
    //console.log(req.body.docs);

    Project.searchProject(data.projectName,function (proj) {


        User.getUserByUsername(data.user,function (user) {



            var docs = [];
            //console.log(req.body.docs);
            console.log('data docs :' + data.docs.length  );
            data.docs.forEach(function (doc) {
                if(doc.allowed)
                    docs.push(doc.docId);
            });

            console.log('docs length : ' + docs.length);




            var auth = Auth.build({

                addNewDoc : data.addFileChecked ,
                removeDoc : data.removeFileChecked
            });
            Auth.addAuthorization(auth,function () {

                console.log('auth added successfully');

                docs.forEach(function (doc) {
                    var auth_doc = Auth_Doc.build({
                        authId : auth.dataValues.id,
                        docId : doc
                    });

                    Auth_Doc.addNewAuth_doc(auth_doc,function () {
                        console.log('auth doc added successfully');
                    });
                });



                var col = Col.build({

                    projectId : proj.dataValues.id ,
                    userId : user.dataValues.id ,
                    begin_date : new Date(),
                    enabled : true ,
                    authorizationId : auth.dataValues.id
                });

                Col.newCollaboration(col,function () {

                    data.newColId = col.dataValues.id ;
                    res.send(data);

                });


            });

        });

    });

});

router.get('/addUser',function (req,res,next) {
    var user = User.build({
        username : 'sirouuxx' ,
        password : 'dasrisiko' ,
        last_name : 'smimah' ,
        first_name : 'sara' ,
        age : 20 ,
        email : 'smimah.sara@gmail.com'
    });


    console.log(user.dataValues);

    User.addNewUser(user,function (newUser) {
        console.log(newUser);
    });

    res.render('index',{ title : 'express'});
});

router.get('/addProjects',function (req,res,next) {

    User.getUserByUsername('sirouuxx',function (user) {

        console.log(user.dataValues);

        var project6 = Project.build({
            name : 'project 6' ,
            description : 'the 6th project of the app',
            creator : user.dataValues.id
        });

        var project1 = Project.build({
            name : 'project 1' ,
            description : 'the first project of the app',
            creator : user.dataValues.id
        });
        var project2 = Project.build({
            name : 'project 2' ,
            description : 'the second project of the app',
            creator : user.dataValues.id
        });
        var project3 = Project.build({
            name : 'project 3' ,
            description : 'the third project of the app',
            creator : user.dataValues.id
        });
        var project4 = Project.build({
            name : 'project 4' ,
            description : 'the 4th project of the app',
            creator : user.dataValues.id
        });

        var project5 = Project.build({
            name : 'project 5' ,
            description : 'the 5th project of the app',
            creator : user.dataValues.id
        });

        Project.addNewProject(project1,function () {
            Project.addNewProject(project2,function () {
                Project.addNewProject(project3,function () {
                    Project.addNewProject(project4,function () {
                        Project.addNewProject(project5,function () {
                            Project.addNewProject(project6,function () {
                                console.log('projects added successfully');
                            });
                        });
                    });
                });
            });
        });



        res.render('index',{ title : 'express'});

    });

});

router.get('/addDocs',function (req,res,next) {

    Project.searchProject('project 1',function (project) {
        console.log(project.dataValues.id);
        var doc1 = Document.build({
            name : 'layout',
            type : 'view',
            content : 'void',
            projectId : project.dataValues.id
        });

        var doc2 = Document.build({
            name : 'style',
            type : 'css',
            content : 'void',
            projectId : project.dataValues.id
        });

        var doc3 = Document.build({
            name : 'script',
            type : 'js',
            content : 'void',
            projectId : project.dataValues.id
        });

        Document.addNewDoc(doc1,function () {
            Document.addNewDoc(doc2,function () {
                Document.addNewDoc(doc3,function () {
                    console.log('docs added successfully');
                });
            });
        });


        res.render('index',{title : 'express'});
    });

});

router.get('/addColls',function (req,res,next) {
    Project.searchProject('project 1',function (project) {
        User.getUserByUsername('sirouuxx',function (user1) {
            User.getUserByUsername('karim88',function (user2) {
                var auth1 = Auth.build({
                    addNewDoc : true,
                    removeDoc : true
                });

                var auth2 = Auth.build({
                    addNewDoc : true,
                    removeDoc : true
                });

                Auth.addAuthorization(auth1,function () {
                    Auth.addAuthorization(auth2,function () {
                        console.log('auths added successfully');
                        Document.searchDocument('layout',function (doc) {
                            Document.searchDocument('style',function (doc1) {
                                Document.searchDocument('script',function (doc2) {
                                    var auth_doc1 = Auth_Doc.build({
                                        authId : auth1.dataValues.id ,
                                        docId : doc.dataValues.id
                                    });

                                    var auth_doc2 = Auth_Doc.build({
                                        authId : auth1.dataValues.id ,
                                        docId : doc1.dataValues.id
                                    });

                                    var auth_doc3 = Auth_Doc.build({
                                        authId : auth1.dataValues.id ,
                                        docId : doc2.dataValues.id
                                    });

                                    var auth_doc4 = Auth_Doc.build({
                                        authId : auth2.dataValues.id ,
                                        docId : doc.dataValues.id
                                    });

                                    var auth_doc5 = Auth_Doc.build({
                                        authId : auth2.dataValues.id ,
                                        docId : doc1.dataValues.id
                                    });

                                    var auth_doc6 = Auth_Doc.build({
                                        authId : auth2.dataValues.id ,
                                        docId : doc2.dataValues.id
                                    });
                                    Auth_Doc.addNewAuth_doc(auth_doc1,function () {
                                        Auth_Doc.addNewAuth_doc(auth_doc2, function () {
                                            Auth_Doc.addNewAuth_doc(auth_doc3, function () {
                                                Auth_Doc.addNewAuth_doc(auth_doc4, function () {
                                                    Auth_Doc.addNewAuth_doc(auth_doc5, function () {
                                                        Auth_Doc.addNewAuth_doc(auth_doc6, function () {
                                                            console.log('auth_docs added successfully');

                                                            var col1 = Col.build({
                                                                userId: user1.dataValues.id,
                                                                projectId: project.dataValues.id,
                                                                begin_date: new Date(),
                                                                enabled: true,
                                                                authorizationId: auth1.dataValues.id
                                                            });

                                                            var col2 = Col.build({
                                                                userId: user2.dataValues.id,
                                                                projectId: project.dataValues.id,
                                                                begin_date: new Date(),
                                                                enabled: true,
                                                                authorizationId: auth2.dataValues.id
                                                            });

                                                            Col.newCollaboration(col1,function () {
                                                                Col.newCollaboration(col2,function () {
                                                                    console.log('cols added successfully');
                                                                    res.render('index', { title: 'Express' });
                                                                });
                                                            });

                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});



module.exports = router;

