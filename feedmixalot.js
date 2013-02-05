// feedmixalot
// https://github.com/pwmckenna/feedmixalot
//
// Copyright (c) 2012 Patrick Williams
// Licensed under the MIT license.

var request = require('request');
var _ = require('underscore');
var q = require('q');
var libxmljs = require("libxmljs");

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

var parseHttpBodies = function(responses) {
    //make sure all of the urls resolved successfully
    if(!_.every(responses, function(response) {
        return response.statusCode === 200;
    })) {
        throw 404;
    }
    return bodies = _.pluck(responses, 'body');
};

var appendChildNode = function(parent, child) {
    var name = child.name();
    if(name === 'item' || name === 'link') {
        // The items should all be included as is.
        parent.addChild(child);
    } else if(name === 'description') {
        // Our generated feed was assigned these when it was created. 
        // lets mixalot! ...ie, merge the text of like elements
        var existingText = parent.get(name).text();
        parent.get(name).text(existingText + ' | ' + child.text());
    }
};

// Glob together all of the contents of the rss feeds
// For us to correctly parse the documents, we need to assume the following
// structure
// <rss>
//   <channel>
//     <item>
//     </item>
//     ...
//   </channel>
// </rss>
var aggregateRssFeedContents = function(feedContents, title) {
    var ret = q.defer();
    var compiled = new libxmljs.Document();
    compiledRss = compiled.node('rss');
    compiledRss.attr({
        'version': '1.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:media': 'http://search.yahoo.com/mrss/'
    });
    compiledChannel = compiledRss.node('channel');
    compiledChannel.node('title', title);
    compiledChannel.node('description', 'Feeds mixed together by Feedmixalot')

    // Parse the xml document of each
    var docs = _.map(feedContents, function(contents) {
        return libxmljs.parseXmlString([contents]);
    });
    // Pull the items out and put it into our return xml document
    _.each(docs, function(doc) {
        var channels = doc.root().find('channel');
        if(channels.length !== 1) {
            // We don't know how to process this feed.
            throw 500;
        }
        var channel = channels[0];

        _.each(channel.childNodes(), _.partial(appendChildNode, compiledChannel));
    });
    ret.resolve(compiledRss);
    return ret.promise;
};

// Request the urls, the hand off the results for processing
var aggregateRssFeedUrls = function(options) {
    var feeds = options.urls;
    var title = options.title;

    var requests = _.map(feeds, function(feed) { 
        return get(feed); 
    });
    return q.all(requests)
        .then(parseHttpBodies)
        .then(function(feedContents) {
            return aggregateRssFeedContents(feedContents, title);
        });
};

module.exports = aggregateRssFeedUrls;