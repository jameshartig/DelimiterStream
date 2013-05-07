var assert = require("assert"),
    FakeReader = require('./lib/FakeReader.js'),
    DelimiterStream = require("../DelimiterStream.js"),
    f, s, matchIndexes = [1,50,250,600,601,603,609,800,900,1000];

f = new FakeReader('utf8');
matchIndexes.forEach(function(m) {
    f.write("\n", m);
});

var dataCount = matchIndexes.length - 1;
f.on('done', function() {
    assert.equal(dataCount, 0);
});

s = new DelimiterStream(f, "\n", "utf8");
var lastMatch = 0,
    currentMatch;
s.on('data', function(data) {
    currentMatch = matchIndexes[matchIndexes.length - (dataCount + 1)];
    assert.equal(data.length, currentMatch - lastMatch);
    lastMatch = currentMatch + 1;
    dataCount--;
});
s.resume();

f.begin();