var assert = require("assert"),
    FakeReader = require('./lib/FakeReader.js'),
    DelimiterStream = require("../DelimiterStream.js"),
    f, s;

//test without any matches
f = new FakeReader();
var gotData = false;
f.on('done', function() {
    assert(!gotData);
});
s = new DelimiterStream(f, "\n");
s.on('data', function() {
    gotData = true;
});
s.resume();
f.begin();