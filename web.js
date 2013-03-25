var http = require('http');
var _ = require('underscore');
var feedmixalot = require('./feedmixalot');
var express = require('express');
var Firebase = require('./lib/firebase-node')
var FirebaseTokenGenerator = require("./lib/firebase-token-generator-node.js");
var q = require('q');
var request = require('request');
var assert = require('assert');
assert(process.env.TODIUM_API_ID, 'must provide a todium api id to track torrent statistics');
assert(process.env.TODIUM_API_SECRET, 'must provide a todium api secret to track torrent statistics');

var app = express();

// Turns the standard node function signature with a callback argument
// into a function that returns a deferred object
var promisify = function (nodeAsyncFn, context) {
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
var post = promisify(request.post);

var trackTorrentLinks = function (node, feedName) {
    var deferreds = _.map(node.childNodes(), function(child) {
        return trackTorrentLinks(child, feedName);
    });

    if(node.name() === 'enclosure' && 
        node.attr('type') && node.attr('type').value() === 'application/x-bittorrent' && 
        node.attr('url')
    ) {
        var url = node.attr('url').value();
        console.log('converting', url);
        var apiUrl = 'http://api.todium.com';
        var trackRequest = post({
            url: apiUrl,
            form: {
                src: url,
                id: process.env.TODIUM_API_ID,
                secret: process.env.TODIUM_API_SECRET
            }
        });
        var rssNodeEdit = trackRequest.then(function(res) {
            if(res.statusCode === 200) {
                console.log('successfully replaced torrent url with a todium link', url, res.body);
                node.attr('url', res.body);
                return q.resolve();
            } else {
                console.error('failed to replace torrent url with a todium link', url);
                return q.resolve();
            }
        });
        deferreds.push(rssNodeEdit);
    } 

    return q.all(deferreds);
}

var firebase = new Firebase('https://rss.firebaseio.com/');

var headers = {
    'content-type': 'application/rss+xml; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
};

app.get('/:link', function(req, res) {
    console.log(req.params.link);
    var link = firebase.child('rss').child(req.params.link);
    link.once('value', function(linkSnapshot) {
        console.log('link value', link.name(), linkSnapshot.val());
        if(!_.isObject(linkSnapshot.val())) {
            res.writeHead(500, headers);
            res.end();
            return;
        }

        var user = linkSnapshot.val().user;
        var feed = linkSnapshot.val().feed;

        console.log('user', user);
        console.log('feed', feed);

        firebase.child('users').child(user.provider).child(user.id).once('value', function (userSnapshot) {
            console.log('user value', user)

            var feedInfo = userSnapshot.val()['feeds'][feed];
            console.log('feedInfo', feedInfo);

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

            aggregateRequest.then(function (aggregate) {
                console.log('aggregate', name, aggregate.toString());
                return trackTorrentLinks(aggregate, name).then(function () {
                    console.log('replaced all torrent links');
                    res.writeHead(200, headers);
                    var body = aggregate.toString();
                    res.end(body);  
                    return q.resolve();
                }, function (err) {
                    res.writeHead(err, headers);
                    res.end('failed to replace torrent links');
                    return q.reject(err);
                });
            }, function (err) {
                res.writeHead(err, headers);
                res.end('failed to aggreate requests');
                return q.reject(err);
            });
        });
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log('listening on port ' + port);    
});
