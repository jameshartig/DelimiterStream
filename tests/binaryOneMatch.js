var assert = require("assert"),
    FakeReader = require('./lib/FakeReader.js'),
    DelimiterStream = require("../DelimiterStream.js"),
    f, s;

f = new FakeReader();
f.write(10, 275); //"\n"
var gotData = false;
f.on('done', function() {
    assert(gotData);
});

s = new DelimiterStream(f, 10, "binary");
s.on('data', function(data) {
    assert.equal(data.length, 274);
    gotData = true;
});
s.resume();

f.begin();