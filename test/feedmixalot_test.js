"use strict";
var feedmixalot = require('../feedmixalot.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['awesome'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'no args': function(test) {
    test.expect(1);
    // tests here
    var emptyFeed = '<rss version="1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Feedmixalot</title><description>Feeds mixed together by Feedmixalot</description></channel></rss>';

    feedmixalot().then(function(contents) {
      test.equal(contents, emptyFeed, 'should be an empty rss feed');
      test.done();
    }, function(err) {
      test.done();
      console.log(err);
    });
  }
};
