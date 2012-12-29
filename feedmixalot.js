/*
 * feedmixalot
 * https://github.com/pwmckenna/feedmixalot
 *
 * Copyright (c) 2012 Patrick Williams
 * Licensed under the MIT license.
 */


var request = require('request')
    , _ = require('underscore')
    , q = require('q')
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
    compiledRss.attr({
        'version': '1.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:media': 'http://search.yahoo.com/mrss/'
    });
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
    ret.resolve(compiledRss.toString());
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

module.exports = aggregateRssFeedUrls;