var http = require('http')
    , _ = require('underscore')
    , feedmixalot = require('./feedmixalot')
    , express = require('express')
    , Firebase = require('./scripts/firebase-node');

var app = express();

app.use(express.static(__dirname + '/public/app'));

app.get('/:feed', function(req, res) {
    console.log(req.params.feed);

    var feeds = [];

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
app.listen(port, function() {
    console.log('listening on port ' + port);    
});
