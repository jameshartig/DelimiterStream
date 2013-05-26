var assert = require("assert"),
    events = require('events'),
    FakeReader = require('./lib/FakeReader.js'),
    DelimiterStream = require("../DelimiterStream.js"),
    f, s;

exports.noMatches = function(test) {
    //test without any matches
    f = new FakeReader();
    var gotData = false;
    f.on('done', function() {
        test.ok(!gotData);
        test.done();
    });
    s = new DelimiterStream(f, "\n");
    s.on('data', function() {
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryOneMatch = function(test) {
    f = new FakeReader();
    f.write(10, 275); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringOneMatch = function(test) {
    f = new FakeReader('utf8');
    f.write("\n", 275); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();
    f.begin();
};


exports.binaryMatchFirst = function(test) {
    f = new FakeReader();
    f.write(10, 0); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 0);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringMatchFirst = function(test) {
    f = new FakeReader('utf8');
    f.write("\n", 0);
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 0);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryMatchLast = function(test) {
    f = new FakeReader();
    f.write(10, 999); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 999);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringMatchLast = function(test) {
    f = new FakeReader('utf8');
    f.write("\n", 999);
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 999);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryTenMatches = function(test) {
    var matchIndexes = [1,50,250,600,601,603,609,800,900,1000];

    f = new FakeReader();
    matchIndexes.forEach(function(m) {
        f.write(10, m); //"\n"
    });

    var dataCount = matchIndexes.length - 1;
    f.on('done', function() {
        test.equal(dataCount, 0);
        test.done();
    });

    s = new DelimiterStream(f, 10, "binary");
    var lastMatch = 0,
        currentMatch;
    s.on('data', function(data) {
        currentMatch = matchIndexes[matchIndexes.length - (dataCount + 1)];
        test.equal(data.length, currentMatch - lastMatch);
        lastMatch = currentMatch + 1;
        dataCount--;
    });
    s.resume();
    f.begin();
};

exports.stringTenMatches = function(test) {
    var matchIndexes = [1,50,250,600,601,603,609,800,900,1000];

    f = new FakeReader('utf8');
    matchIndexes.forEach(function(m) {
        f.write("\n", m);
    });

    var dataCount = matchIndexes.length - 1;
    f.on('done', function() {
        test.equal(dataCount, 0);
        test.done();
    });

    s = new DelimiterStream(f, "\n", "utf8");
    var lastMatch = 0,
        currentMatch;
    s.on('data', function(data) {
        currentMatch = matchIndexes[matchIndexes.length - (dataCount + 1)];
        test.equal(data.length, currentMatch - lastMatch);
        lastMatch = currentMatch + 1;
        dataCount--;
    });
    s.resume();
    f.begin();
};

exports.removedListeners = function(test) {
    f = new FakeReader();
    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {});
    s.resume();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 1);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);

    s.destroy();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
    test.done();
};

exports.removedListeners = function(test) {
    f = new FakeReader();
    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {});
    s.resume();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 1);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);

    s.destroy();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
    test.done();
};


exports.oneMatchThenClose = function(test) {
    f = new FakeReader('utf8');
    f.write("\n", 275); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);

        //"close" the reader on nextTick
        f.close();
        process.nextTick(function() {
            test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
            test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
            test.done();
        });
    });

    s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 1);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);

    f.begin();
};