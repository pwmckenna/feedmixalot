var http = require('http')
    , _ = require('underscore')
    , feedmixalot = require('./feedmixalot')
    , express = require('express')
    , Firebase = require('./scripts/firebase-node')
    , FirebaseTokenGenerator = require("./scripts/firebase-token-generator-node.js");

var app = express();
var tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET);
var token = tokenGenerator.createToken({}, {
    admin: true
});

var onFirebaseLogin = function(success) {
    if(success) {
        console.log('firebase login success');
    } else {
        console.log('firebase login failure');
    }
};

var firebase = new Firebase('https://feedmixalot.firebaseIO.com/');
firebase.auth(token, onFirebaseLogin);

var headers = {
    'content-type': 'application/rss+xml; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
};

app.get('/:link', function(req, res) {
    console.log(req.params.link);
    var link = firebase.child('links').child(req.params.link);

    link.once('value', function(linkSnapshot) {
        if(!_.isObject(linkSnapshot.val())) {
            res.writeHead(500, headers);
            res.end();
            return;
        }

        var user = linkSnapshot.val().user;
        var feed = linkSnapshot.val().feed;

        firebase.child('users').child(user).child('feeds').child(feed).once('value', function(feedSnapshot) {
            var name = feedSnapshot.val().name;
            var urls = _.pluck(_.values(feedSnapshot.val().urls), 'url');

            //support for cross domain requests
            //do a bit of url argument validation
            if(!_.isArray(urls)) {
                res.writeHead(500, headers);
                res.end();
                return;
            }
            console.log(urls);
            //get all the url contents and glob it into a single xml document
            var aggregateRequest = feedmixalot({
                urls: urls,
                title: name
            });
            aggregateRequest.then(function(aggregate) {
                res.writeHead(200, headers);
                var body = aggregate;
                res.end(body);
            }, function(err) {
                res.writeHead(err, headers);
                res.end();
                return;
            });
        });
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log('listening on port ' + port);    
});
