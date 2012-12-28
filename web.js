var http = require('http')
    , url = require('url')
    , _ = require('underscore')
    , feedmixalot = require('./feedmixalot');

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
        res.writeHead(500, headers);
        res.end();
        return;
    }

    //get all the url contents and glob it into a single xml document
    var aggregateRequest = feedmixalot(feeds);
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

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('listening on port ' + port);    
});
