var util = require('util'),
    events = require('events');

/**
 * Emit "data" events for each match
 */
function emitEvents(stream) {
    var i = stream.matches.length;
    while (i--) {
        stream.emit('data', stream.matches[i]);
    }
    stream.matches = [];
}

/**
 * Handle data from a string stream
 */
function handleData(stream, asString, data) {
    var i = data.length,
        origLastMatch, //data after the first occurrence of delimiter
        sliceFuncName = asString ? 'substring': 'slice';
    while (i--) {
        if (data[i] === stream.delimiter) {
            origLastMatch = i;
            break;
        }
    }
    if (i === -1) {
        stream.buffer.push(data);
        return;
    }
    var lastMatch = i;
    while (i--) {
        if (data[i] === stream.delimiter) {
            stream.matches.push(data[sliceFuncName](i + 1, lastMatch));
            lastMatch = i;
        }
    }
    //now that the loop is done, need to add on bufferString to the beginning of data
    stream.buffer.push(data[sliceFuncName](0, lastMatch));
    if (asString) {
        stream.matches.push(stream.buffer.join(""));
    } else {
        stream.matches.push(Buffer.concat(stream.buffer));
    }
    stream.buffer = [data[sliceFuncName](origLastMatch + 1)];

    if (stream.emitEvents) {
        emitEvents(stream);
    }
}


/**
 * Read data from a string stream
 */
function readStringData() {
    var data = this.readableStream.read();
    if (!data) {
        return;
    }
    handleData(this, true, data);
}

/**
 * Read data from a binary stream
 */
function readBinaryData() {
    var data = this.readableStream.read();
    if (!data) {
        return;
    }
    handleData(this, false, data);
}

/**
 * Encoding should be what you set on the readableStream.
 */
function DelimiterStream(readableStream, delimiter, encoding, oldStream, initialBuffer) {
    //todo: when we remove oldStream, check read()
    if (!readableStream || typeof readableStream.on !== 'function') {
        throw new Error('DelimiterStream requires a valid ReadableStream!');
    }
    events.EventEmitter.call(this);

    if (!encoding) {
        encoding = 'binary';
    }
    if (!delimiter && encoding === 'binary') {
        delimiter = 10; //'\n'
    } else if (!delimiter) {
        delimiter = "\n";
    }

    this._reFireListeners = {};
    this.delimiter = delimiter;
    this.readableStream = readableStream;
    this.emitEvents = false;
    this.matches = [];
    this.buffer = initialBuffer || [];

    this._closeCallback = this.onStreamClose.bind(this);
    readableStream.on('close', this._closeCallback);

    if (oldStream) {
        console.warn('Deprecation warning: oldStream argument to DelimiterStream is deprecated!');
        if (encoding === 'binary') {
            this._dataCallback = handleData.bind(this, this, false);
        } else {
            this._dataCallback = handleData.bind(this, this, true);
        }
        readableStream.on('data', this._dataCallback);
        readableStream.resume();
    } else {
        if (encoding === 'binary') {
            this._readableCallback = readBinaryData.bind(this);
        } else {
            this._readableCallback = readStringData.bind(this);
        }
        readableStream.on('readable', this._readableCallback);
    }
}

util.inherits(DelimiterStream, events.EventEmitter);

/**
 * A DelimiterStream is in the paused state by default.
 * By calling resume() you're allowing data events to start firing.
 */
DelimiterStream.prototype.resume = function() {
    this.emitEvents = true;
    //emit any events we might have missed
    emitEvents(this);
    return this;
};

DelimiterStream.prototype.pause = function() {
    this.emitEvents = false;
    return this;
};

DelimiterStream.prototype.addListener = function(type, listener) {
    if (type === 'readable') {
        console.warn("Potentially invalid use of DelimiterStream. 'readable' events are not fired, only 'data' events.");
        return this;
    }
    events.EventEmitter.prototype.addListener.call(this, type, listener);
    if (this._reFireListeners[type] == null && type && type !== 'data' && type !== 'close') {
        this._reFireListeners[type] = this.emit.bind(this, type);
        this.readableStream.on(type, this._reFireListeners[type]);
    }
    return this;
};
DelimiterStream.prototype.on = DelimiterStream.prototype.addListener;

DelimiterStream.prototype.removeListener = function(type, listener) {
    events.EventEmitter.prototype.removeListener.call(this, type, listener);
    if (type && this._events[type] == null && this._reFireListeners[type] != null) {
        this.readableStream.removeListener(type, this._reFireListeners[type]);
        delete this._reFireListeners[type];
    }
    return this;
};

DelimiterStream.prototype.removeAllListeners = function(type) {
    events.EventEmitter.prototype.removeAllListeners.call(this, type);
    if (type && this._reFireListeners[type] != null) {
        this.readableStream.removeListener(type, this._reFireListeners[type]);
        delete this._reFireListeners[type];
    } else if (type == null) {
        for (var t in this._reFireListeners) {
            this.readableStream.removeListener(t, this._reFireListeners[t]);
        }
        this._reFireListeners = {};
    }
    return this;
};

//on underlying stream close we should destroy and emit close
DelimiterStream.prototype.onStreamClose = function () {
    this.destroy();
    if (arguments.length > 0) {
        this.emit.call(this, ['close'].concat(arguments));
    } else {
        this.emit('close');
    }
};

/**
 * When you're finished with a stream, call destroy to remove all listeners and cleanup.
 */
DelimiterStream.prototype.destroy = function() {
    this.readableStream.removeListener('close', this._closeCallback);
    if (this._dataCallback) {
        this.readableStream.removeListener('data', this._dataCallback);
    }
    if (this._readableCallback) {
        this.readableStream.removeListener('readable', this._readableCallback);
    }
    this.buffer = [];
    this.emitEvents = false;
    this.removeAllListeners();
    if (typeof this.readableStream.destroy === 'function') {
        this.readableStream.destroy.apply(this.readableStream, arguments);
    }
    this.readableStream = null;
    return this;
};

//some helper passthru events
var passthruEvents = ['write', 'connect', 'end', 'ref', 'unref', 'setTimeout', 'abort'];
do {
    var e = passthruEvents.pop();
    DelimiterStream.prototype[e] = function () {
        this.readableStream[e].apply(this.readableStream, arguments);
    };
} while (passthruEvents[0] != null);

/**
 * Helper getter functions
 */
DelimiterStream.prototype.getStream = function() {
    return this.readableStream;
};
DelimiterStream.prototype.getBuffer = function() {
    return this.buffer.slice(0);
};

module.exports = DelimiterStream;
