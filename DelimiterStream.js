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
 * Read data from the stream and make matches based on delimiter
 */
function readStringData() {
    var data = this.readableStream.read();
    if (!data) {
        return;
    }
    var i = data.length,
        origLastMatch; //data after the first occurrence of delimiter
    while (i--) {
        if (data[i] === this.delimiter) {
            origLastMatch = i;
            break;
        }
    }
    if (i === -1) {
        this.buffer.push(data);
        return;
    }
    var lastMatch = i;
    while (i--) {
        if (data[i] === this.delimiter) {
            this.matches.push(data.substring(i + 1, lastMatch));
            lastMatch = i;
        }
    }
    //now that the loop is done, need to add on bufferString to the beginning of data
    this.buffer.push(data.substring(0, lastMatch));
    this.matches.push(this.buffer.join(""));
    this.buffer = [data.substring(origLastMatch + 1)];

    if (this.emitEvents) {
        emitEvents(this);
    }
}

function readBinaryData() {
    var data = this.readableStream.read();
    if (!data) {
        return;
    }
    var i = data.length,
        origLastMatch; //data after the first occurrence of delimiter
    while (i--) {
        if (data[i] === this.delimiter) {
            origLastMatch = i;
            break;
        }
    }
    if (i === -1) {
        this.buffer.push(data);
        return;
    }
    var lastMatch = i;
    while (i--) {
        if (data[i] === this.delimiter) {
            this.matches.push(data.slice(i + 1, lastMatch));
            lastMatch = i;
        }
    }
    //now that the loop is done, need to add on bufferString to the beginning of data
    this.buffer.push(data.slice(0, lastMatch));
    this.matches.push(Buffer.concat(this.buffer));
    this.buffer = [data.slice(origLastMatch + 1)];

    if (this.emitEvents) {
        emitEvents(this);
    }
}

/**
 * Encoding should be what you set on the readableStream.
 */
function DelimiterStream(readableStream, delimiter, encoding) {
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
    if (encoding === "binary") {
        readableStream.on('readable', readBinaryData.bind(this));
    } else {
        readableStream.on('readable', readStringData.bind(this));
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

module.exports = DelimiterStream;
