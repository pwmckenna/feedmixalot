var http = require('http');
var _ = require('underscore');
var feedmixalot = require('./feedmixalot');
var express = require('express');
var Firebase = require('./scripts/firebase-node')
var FirebaseTokenGenerator = require("./scripts/firebase-token-generator-node.js");
var q = require('q');
var request = require('request');

var app = express();
var tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET);
var token = tokenGenerator.createToken({}, {
    admin: true
});

var trackTorrentLinks = function(node, token) {
    var d = new q.defer();
    d.resolve();
    var ret = d.promise;

    if(node.name() === 'enclosure' && 
        node.attr('type') && node.attr('type').value() === 'application/x-bittorrent' && 
        node.attr('url')
    ) {
        var url = node.attr('url').value();
        console.log('converting', url);
        ret = ret.then(function() {
            var d = new q.defer();
            var apiUrl = 'http://api.todium.com/?src=' + url + '&token=' + token;
            console.log(apiUrl);
            request.get(
                apiUrl, 
                function(error, result, body) {
                    console.log(error, body);//console.log('api token result', error, result.statusCode, body);
                    node.attr('url', body);
                    d.resolve();
                }
            );
            return d.promise;
        });
    } 

    _.each(node.childNodes(), function(child) {
        ret = ret.then(_.partial(trackTorrentLinks, child, token));
    });

    return ret;
}

var onFirebaseLogin = function(error, dummy) {
    if(error) {
        console.log('firebase login failure', error);
    } else {
        console.log('firebase login success');
    }
};

var firebase = new Firebase('https://featuredcontent.firebaseIO.com/');
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

        console.log('user', user);
        console.log('feed', feed);

        firebase.child('users').child(user.provider).child(user.id).once('value', function(userSnapshot) {
            var feedInfo = userSnapshot.val()['feeds'][feed];
            var userToken = userSnapshot.val()['token'];
            console.log('feedInfo', feedInfo);
            console.log('userToken', userToken);

            var name = feedInfo.name;
            var urls = _.pluck(_.values(feedInfo.urls), 'url');

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
                trackTorrentLinks(aggregate, userToken).then(function() {
                    res.writeHead(200, headers);
                    var body = aggregate.toString();
                    res.end(body);                    
                })
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
