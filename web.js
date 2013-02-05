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

// Turns the standard node function signature with a callback argument
// into a function that returns a deferred object
var promisify = function(nodeAsyncFn, context) {
  return function() {
    var defer = new q.defer()
      , args = Array.prototype.slice.call(arguments);

    args.push(function(err, val) {
      if (err !== null) {
        return defer.reject(err);
      }

      return defer.resolve(val);
    });

    nodeAsyncFn.apply(context || {}, args);

    return defer.promise;
  };
};
// Wrap our get requests so it plays nicely with all our other
// defered object code
var get = promisify(request.get);

var cachedGet = function(cache, options) {
    return get(options);
}

var trackTorrentLinks = function(node, token, feedName, cache) {
    var d = new q.defer();
    d.resolve();
    var ret = d.promise;

    if(node.name() === 'enclosure' && 
        node.attr('type') && node.attr('type').value() === 'application/x-bittorrent' && 
        node.attr('url')
    ) {
        var url = node.attr('url').value();
        console.log('converting', url);

        var labels = [
            'feedmixalot', 
            feedName,
            url
        ];

        ret = ret.then(function() {
            var apiUrl = 'http://api.todium.com';
            var trackRequest = cachedGet(cache, {
                url: apiUrl,
                qs: {
                    src: url,
                    token: token,
                    labels: labels
                }
            });
            return trackRequest.then(function(body) {
                node.attr('url', body);
            });
        });
    } 

    _.each(node.childNodes(), function(child) {
        ret = ret.then(_.partial(trackTorrentLinks, child, token, feedName, cache));
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
        console.log('link value', link, linkSnapshot.val());
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
            console.log('user value', user)

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
                res.end('urls are not an array');
                return;
            }
            console.log(urls);
            //get all the url contents and glob it into a single xml document
            var aggregateRequest = feedmixalot({
                urls: urls,
                title: name
            });

            var cache = {

            };

            aggregateRequest.then(function(aggregate) {
                trackTorrentLinks(aggregate, userToken, name, cache).then(function() {
                    res.writeHead(200, headers);
                    var body = aggregate.toString();
                    res.end(body);                    
                })
            }, function(err) {
                res.writeHead(err, headers);
                res.end('failed to aggreate requests');
                return;
            });
        });
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log('listening on port ' + port);    
});
