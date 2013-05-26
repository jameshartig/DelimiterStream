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
function handleStringData(stream, data) {
    var i = data.length,
        origLastMatch; //data after the first occurrence of delimiter
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
            stream.matches.push(data.substring(i + 1, lastMatch));
            lastMatch = i;
        }
    }
    //now that the loop is done, need to add on bufferString to the beginning of data
    stream.buffer.push(data.substring(0, lastMatch));
    stream.matches.push(stream.buffer.join(""));
    stream.buffer = [data.substring(origLastMatch + 1)];

    if (stream.emitEvents) {
        emitEvents(stream);
    }
}

/**
 * Handle data from a binary stream
 */
function handleBinaryData(stream, data) {
    var i = data.length,
        origLastMatch; //data after the first occurrence of delimiter
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
            stream.matches.push(data.slice(i + 1, lastMatch));
            lastMatch = i;
        }
    }
    //now that the loop is done, need to add on bufferString to the beginning of data
    stream.buffer.push(data.slice(0, lastMatch));
    stream.matches.push(Buffer.concat(stream.buffer));
    stream.buffer = [data.slice(origLastMatch + 1)];

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
    handleStringData(this, data);
}

/**
 * Read data from a binary stream
 */
function readBinaryData() {
    var data = this.readableStream.read();
    if (!data) {
        return;
    }
    handleBinaryData(this, data);
}

/**
 * Encoding should be what you set on the readableStream.
 */
function DelimiterStream(readableStream, delimiter, encoding, oldStream) {
    events.EventEmitter.apply(this);

    this.delimiter = delimiter;
    this.readableStream = readableStream;
    if (!encoding) {
        encoding = "binary";
    }
    this.encoding = encoding;
    this.emitEvents = false;
    this.matches = [];
    this.buffer = [];

    /**
     * todo: there has to be a better way than storing the callbacks
     * (without using arguments.callee.caller)
     */
    this.destroyCallback = this.destroy.bind(this);
    readableStream.on('close', this.destroyCallback);

    if (oldStream) {
        if (encoding === "binary") {
            this.listenCallback = handleBinaryData.bind(this, this);
        } else {
            this.listenCallback = handleStringData.bind(this, this);
        }
        readableStream.on('data', this.listenCallback);
        readableStream.resume();
    } else {
        if (encoding === "binary") {
            this.listenCallback = readBinaryData.bind(this);
        } else {
            this.listenCallback = readStringData.bind(this);
        }
        readableStream.on('readable', this.listenCallback);
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
};

DelimiterStream.prototype.pause = function() {
    this.emitEvents = false;
};

/**
 * When you're finished with a stream, call destroy to remove
 * any listeners. Note: this WILL remove any listeners you have
 * added to "data".
 */
DelimiterStream.prototype.destroy = function() {
    if (!this.readableStream) {
        return;
    }
    this.readableStream.removeListener('close', this.destroyCallback);
    this.readableStream.removeListener('readable', this.listenCallback);
    this.readableStream.removeListener('data', this.listenCallback);
    this.buffer = [];
    this.emitEvents = false;
    this.removeAllListeners();
    this.readableStream = null;
};

/**
 * Helper function to get the underlying stream
 */
DelimiterStream.prototype.getStream = function() {
    return this.readableStream;
};

module.exports = DelimiterStream;
