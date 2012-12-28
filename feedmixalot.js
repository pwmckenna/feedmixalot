/**
 * Module dependencies.
 */
var http = require('http')
    , request = require('request')
    , _ = require('underscore')
    , q = require('q')
    , url = require('url')
    , libxmljs = require("libxmljs");

//turns the standard node function signature with a callback argument
//into a function that returns a deferred object
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
//wrap our get requests so it plays nicely with all our other
//defered object code
var get = promisify(request.get);

var parseHttpBodies = function(responses) {
    //make sure all of the urls resolved successfully
    if(!_.every(responses, function(response) {
        return response.statusCode === 200;
    })) {
        throw 404;
    }
    return bodies = _.pluck(responses, 'body');
};

//glob together all of the contents of the rss feeds
var aggregateRssFeedContents = function(feedContents) {
    var ret = q.defer();
    var compiled = new libxmljs.Document();
    compiledRss = compiled.node('rss');
    compiledChannel = compiledRss.node('channel');

    //parse the xml document of each
    var docs = _.map(feedContents, function(contents) {
        return libxmljs.parseXmlString([contents]);
    });
    //pull the items out and put it into our return xml document
    _.each(docs, function(doc) {
        _.each(doc.root().get('channel').childNodes(), function(child) {
            compiledChannel.addChild(child);
        });
    });
    ret.resolve(compiledRss);
    return ret.promise;
};

//request the urls, the hand off the results for processing
var aggregateRssFeedUrls = function(feeds) {
    var requests = _.map(feeds, function(feed) { 
        return get(feed); 
    });
    return q.all(requests)
        .then(parseHttpBodies)
        .then(aggregateRssFeedContents);    
};

var server = http.createServer(function (req, res) {
    //url parsing
    var query = url.parse(req.url, true).query;
    //only support one argument so far
    var feeds = query['url'];
    //feeds will either be a string or an array of strings
    //if multiple url parameters are specified
    if(typeof feeds === 'string') {
        feeds = [feeds];
    }
    //support for cross domain requests
    var headers = {
        'content-type': 'application/rss+xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    };
    //do a bit of url argument validation
    if(!_.isArray(feeds)) {
        response.writeHead(500, headers);
        res.end();
        return;
    }

    //get all the url contents and glob it into a single xml document
    var aggregateRequest = aggregateRssFeedUrls(feeds);
    aggregateRequest.then(function(aggregate) {
        res.writeHead(200, headers);
        var body = aggregate.toString();
        res.end(body);
    }, function(err) {
        res.writeHead(err, headers);
        res.end();
        return;
    });

});

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('listening on port ' + port);    
});
