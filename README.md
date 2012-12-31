# Who?
Anyone maintaining/consuming multiple rss feeds.

# What?
Rss feed aggregator - initially tuned specifically to torrent client rss feed support. All feed mashups will be public, meaning you can look around for other folks rss feeds of rss feeds and easily extend it to include all the feeds you think are missing.

# Why?
Existing RSS feed aggregators such as http://www.chimpfeedr.com/ don't generate feeds that work with torrent clients, and don't offer the level of flexibility I would like. The goal is to be able to maintain an rss feed of rss feeds, but to serve them dynamically as a single feed. These aggregate feeds should then be given tiny urls that can be edited later and consumed themselves by feedmixalot.

I would like to provide rss feed aggregators much of the functionality that libraries such as [underscore.js](http://underscorejs.org) provide.  
* [sortBy](http://underscorejs.org/#sortBy)
* [where](http://underscorejs.org/#where)
* [filter](http://underscorejs.org/#filter) ... this is possible if we serialize the filter function on the browser side and store it in the server...dangerous?
* [reject](http://underscorejs.org/#reject) ... same concerns as filter

# Where?
The source is obviously hosted here on github, and its currently [running on heroku](http://feedmixalot.herokuapp.com/?url=http://www.clearbits.net/feeds/creator/191-megan-lisa-jones.rss&url=http://www.clearbits.net/feeds/cat/pictures.rss&url=http://archive.org/services/collection-rss.php?mediatype=movies).

## How
### Module
FeedMixAlot is available via npm: `npm install feedmixalot`

It is a single function that takes a list of rss feed urls and returns a promise that is resolved with a single rss feed contains the mashed up contents. If there is a problem at any point, the promise will be rejected with an appropriate http status code.

```javascript
var feedmixalot = require('feedmixalot');
var feeds = [
  'http://www.clearbits.net/feeds/creator/191-megan-lisa-jones.rss',
  'http://www.clearbits.net/feeds/cat/pictures.rss'
];
var mixRequest = feedmixalot(feeds);
mixRequest.done(function(contents) {
  // shove the contents out the socket
});
mixRequest.fail(function(status) {
  // this will be 400 or 500 or something like that...so just shoot of a header with this as the status
})
```

### Http api
Available at http://feedmixalot.herokuapp.com.

Takes multiple `url` arguments and dynamically creates a single rss feed.
```
http://feedmixalot.herokuapp.com/?url=http://www.clearbits.net/feeds/creator/191-megan-lisa-jones.rss&url=http://www.clearbits.net/feeds/cat/pictures.rss
```

### Deploying on Heroku
* Install the [Heroku Toolbelt](https://toolbelt.heroku.com/)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2012 Patrick Williams  
Licensed under the MIT license.
