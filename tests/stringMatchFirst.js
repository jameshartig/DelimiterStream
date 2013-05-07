var assert = require("assert"),
    FakeReader = require('./lib/FakeReader.js'),
    DelimiterStream = require("../DelimiterStream.js"),
    f, s;

f = new FakeReader('utf8');
f.write("\n", 0);
var gotData = false;
f.on('done', function() {
    assert(gotData);
});

s = new DelimiterStream(f, "\n", "utf8");
s.on('data', function(data) {
    assert.equal(data.length, 0);
    gotData = true;
});
s.resume();

f.begin();