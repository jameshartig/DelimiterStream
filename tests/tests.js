//todo: utilize nodeunit groups
var events = require('events'),
    net = require('net'),
    FakeReader = require('./lib/FakeReader.js'),
    DataEmitter = require('./lib/DataEmitter.js'),
    DelimiterStream = require("../DelimiterStream.js");

exports.noMatches = function(test) {
    var f = new FakeReader();
    var gotData = false;
    f.on('done', function() {
        test.ok(!gotData);
        test.done();
    });
    var s = new DelimiterStream(f, "\n", "binary");
    s.on('data', function() {
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryOneMatch = function(test) {
    var f = new FakeReader();
    f.write(10, 275); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringOneMatch = function(test) {
    var f = new FakeReader('utf8');
    f.write("\n", 275); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryMatchFirst = function(test) {
    var f = new FakeReader();
    f.write(10, 0); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 0);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringMatchFirst = function(test) {
    var f = new FakeReader('utf8');
    f.write("\n", 0);
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 0);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryMatchLast = function(test) {
    var f = new FakeReader();
    f.write(10, 999); //"\n"
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, 10, "binary");
    s.on('data', function(data) {
        test.equal(data.length, 999);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.stringMatchLast = function(test) {
    var f = new FakeReader('utf8');
    f.write("\n", 999);
    var gotData = false;
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    var s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 999);
        gotData = true;
    });
    s.resume();
    f.begin();
};

exports.binaryTenMatches = function(test) {
    var matchIndexes = [1,50,250,600,602,605,609,800,900,1000],
        f = new FakeReader();

    matchIndexes.forEach(function(m) {
        f.write(10, m); //"\n"
    });

    var dataCount = matchIndexes.length - 1;
    f.on('done', function() {
        test.equal(dataCount, 0);
        test.done();
    });

    var s = new DelimiterStream(f, 10, "binary"),
        lastMatch = 0,
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
    var matchIndexes = [1,50,250,600,602,605,609,800,900,1000],
        f = new FakeReader('utf8');

    matchIndexes.forEach(function(m) {
        f.write("\n", m);
    });

    var dataCount = matchIndexes.length - 1;
    f.on('done', function() {
        test.equal(dataCount, 0);
        test.done();
    });

    var s = new DelimiterStream(f, "\n", "utf8"),
        lastMatch = 0,
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
exports.stringTenMatchesOld = function(test) {
    test.__oldStyle = true;
    exports.stringTenMatches(test);
};

exports.removedListeners = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function() {});
    s.resume();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 1);
    test.equal(events.EventEmitter.listenerCount(f, 'data'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);

    s.destroy();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'data'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
    test.done();
};

exports.oneMatchThenClose = function(test) {
    var f = new FakeReader('utf8'),
        gotData = false,
        gotClose = false;
    f.write("\n", 275); //"\n"
    f.on('done', function() {
        test.ok(gotData);

        //"close" the reader on nextTick
        f.close();
        process.nextTick(function() {
            test.ok(gotClose);
            test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
            test.equal(events.EventEmitter.listenerCount(f, 'data'), 0);
            test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
            test.done();
        });
    });

    var s = new DelimiterStream(f, "\n", "utf8");
    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.on('close', function() {
        gotClose = true;
    });
    s.resume();

    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 1);
    test.equal(events.EventEmitter.listenerCount(f, 'data'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);

    f.begin();
};

exports.passthruEvent = function(test) {
    var f = new FakeReader(),
        gotError = false,
        errorCallback = function(data) {
            test.equal(data, "test");
            gotError = true;
        },
        s = new DelimiterStream(f, "\n", "utf8");
    s.on('error', errorCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 1);
    f.emit('error', "test");
    s.removeListener('error', errorCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 0);
    test.ok(gotError);
    test.done();
};

exports.passthruRemoveAllListeners = function(test) {
    var f = new FakeReader(),
        gotError = false,
        errorCallback = function(data) {
            test.equal(data, "test");
            gotError = true;
        },
        s = new DelimiterStream(f, "\n", "utf8");
    s.on('error', errorCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 1);
    f.emit('error', "test");
    s.removeAllListeners('error');
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 0);
    test.ok(gotError);
    test.done();
};

exports.passthruRemoveAllAllListeners = function(test) {
    var f = new FakeReader(),
        gotError = false,
        errorCallback = function(data) {
            test.equal(data, "test");
            gotError = true;
        },
        s = new DelimiterStream(f, "\n", "utf8");
    s.on('error', errorCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 1);
    f.emit('error', "test");
    s.removeAllListeners();
    test.equal(events.EventEmitter.listenerCount(f, 'error'), 0);
    test.equal(events.EventEmitter.listenerCount(s, 'error'), 0);
    test.ok(gotError);
    test.done();
};

exports.stringOneMatchPassthru = function(test) {
    var f = new FakeReader('utf8'),
        s = new DelimiterStream(f, "\n", "utf8"),
        gotData = false;
    s.write("\n", 275); //"\n"

    s.on('data', function(data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();

    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });

    f.begin();
};

exports.defaultArgs = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f),
        gotData = false;
    s.write(10, 275); //"\n"

    s.on('data', function (data) {
        test.equal(data.length, 275);
        gotData = true;
    });
    s.resume();

    f.on('done', function (isOld) {
        test.equal(isOld, false); //sanity check
        test.ok(gotData);
        test.done();
    });

    f.begin();
};

exports.passthruClose = function(test) {
    var f = new FakeReader(),
        gotError = false,
        closeCallback = function(data, data2) {
            test.equal(data, "test");
            test.equal(data2, "test2");
            gotError = true;
        },
        s = new DelimiterStream(f, "\n", "utf8");
    s.on('close', closeCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 1);
    f.emit('close', "test", "test2");
    s.removeListener('error', closeCallback);
    test.equal(events.EventEmitter.listenerCount(f, 'close'), 0);
    test.equal(events.EventEmitter.listenerCount(f, 'readable'), 0);
    //we're no longer removing the self event listners by default
    test.equal(events.EventEmitter.listenerCount(s, 'close'), 1);
    test.equal(s.readableStream, null);
    test.ok(gotError);
    test.done();
};

exports.invalidEncodingThrows = function(test) {
    var gotError = false,
        f = new FakeReader();
    f.setEncoding('hex');
    try {
        var s = new DelimiterStream(f, "\n", 'utf8');
    } catch (e) {
        if (e instanceof Error && e.message.indexOf('DelimiterStream was setup') === 0) {
            gotError = true;
        }
    }
    test.ok(gotError);
    test.done();
};

exports.setEncodingPassedIn = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f, "\n", 'utf8');
    test.equal('utf8', f._readableState.encoding);
    test.done();
};

exports.setEncodingPassedInBinary = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f, "\n");
    test.equal(null, f._readableState.encoding);
    test.done();
};

exports.destroyTwice = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f, "\n");
    s.destroy();
    s.destroy();
    test.done();
};

exports.writeAfterDestroy = function(test) {
    var f = new FakeReader(),
        s = new DelimiterStream(f, "\n");
    s.destroy();
    s.on('error', function() {
        test.done();
    });
    s.write();
};

exports.matchBackToBack = function(test) {
    var matchIndexes = [11,12,13],
        chunkID = 0,
        actualChunks = 1, //we're ignoring the matches back to back
        f = new FakeReader();

    matchIndexes.forEach(function(m) {
        f.write(10, m); //"\n"
    });

    f.on('done', function() {
        test.equal(actualChunks, chunkID);
        test.done();
    });

    var s = new DelimiterStream(f, 10, "binary"),
        lastMatchIndex = 0,
        currentMatchIndex;
    s.on('data', function(data) {
        currentMatchIndex = matchIndexes[chunkID];
        test.equal(data.length, currentMatchIndex - lastMatchIndex);
        lastMatchIndex = currentMatchIndex + 1;
        chunkID++;
    });
    s.resume();
    f.begin();
};

exports.dataInData = function(test) {
    var matchIndexes = [4, 9, 19],
        f = new FakeReader(null, 20, 5),
        chunkID = 0,
        actualChunks = 3; //we're ignoring the matches back to back

    f.write(10, 4);
    f.write(10, 9);

    f.on('done', function() {
        test.equal(actualChunks, chunkID);
        test.done();
    });

    var s = new DelimiterStream(f),
        lastMatchIndex = 0,
        currentMatchIndex;
    s.on('data', function(data) {
        currentMatchIndex = matchIndexes[chunkID];
        test.equal(data.length, currentMatchIndex - lastMatchIndex);
        lastMatchIndex = currentMatchIndex + 1;
        //now force DelimiterStream to start reading the next chunk
        if (chunkID === 1) {
            f.write(10, 19);
            //now ghetto force a read
            s._readableCallback();
        }
        chunkID++;
    });
    s.resume();
    f.begin();
};

exports.wrapCtxArgs = function(test) {
    var gotData = false,
        ctx = this,
        obj = {},
        obj2 = {},
        f = new DataEmitter();
    f.write(10, 1); //"\n"
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });
    f.on('data', DelimiterStream.wrap(function(o, o2, data) {
        test.strictEqual(ctx, this);
        test.strictEqual(o, obj);
        test.strictEqual(o2, obj2);
        test.equal(data.length, 1);
        gotData = true;
    }, ctx, obj, obj2));
    f.begin();
};

exports.wrapBinaryOneMatch = function(test) {
    var gotData = false,
        f = new DataEmitter();
    f.write(10, 275); //"\n"
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });
    f.on('data', DelimiterStream.wrap(function(data) {
        test.equal(data.length, 275);
        gotData = true;
    }));
    f.begin();
};

exports.wrapStringOneMatch = function(test) {
    var gotData = false,
        f = new DataEmitter('utf8');
    f.write("\n", 275); //"\n"
    f.on('done', function() {
        test.ok(gotData);
        test.done();
    });
    f.on('data', DelimiterStream.wrap(function(data) {
        test.equal(data.length, 275);
        gotData = true;
    }));
    f.begin();
};

exports.wrapFlush = function(test) {
    var gotData = false,
        gotFlush = false,
        max = 300,
        wrap = DelimiterStream.wrap(function(data) {
            if (gotData) {
                //minus 1 for \n
                test.equal(data.length, max - 275 - 1);
                gotFlush = true;
            } else {
                test.equal(data.length, 275);
                gotData = true;
            }
        }),
        f = new DataEmitter('utf8', max);
    f.write("\n", 275); //"\n"
    f.on('done', function() {
        test.ok(gotData);
        wrap(null);
        test.ok(gotFlush);
        test.done();
    });
    f.on('data', wrap);
    f.begin();
};
