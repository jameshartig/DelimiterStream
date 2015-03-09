var util = require('util'),
    events = require('events');

function DataEmitter(enc, n, i) {
    events.EventEmitter.apply(this);

    n = n || 1000;
    this.buffer = new Buffer(n);
    this.buffer.fill(48); //"0"
    this.position = 0;
    this.max = n;
    this.interval = i || 250; //interval which causes a break in the read loop
    this._readableState = {encoding: null};
    this.done = false;
    if (enc) {
        this.setEncoding(enc);
    }
}
util.inherits(DataEmitter, events.EventEmitter);

DataEmitter.prototype.write = function() {
    if (this._readableState.encoding) {
        this.buffer.write.apply(this.buffer, Array.prototype.slice.call(arguments, 0));
    } else {
        this.buffer[arguments[1]] = arguments[0];
    }
};
DataEmitter.prototype.setEncoding = function(encoding) {
    this._readableState.encoding = encoding;
};

DataEmitter.prototype.read = function(n) {
    if (this.position >= this.max) {
        this.done = true;
        this.emit('done');
        return null;
    }

    n = n || this.max;
    var start = this.position;
    while (this.position++ < this.max && (this.position - start) <= n) {
        if ((this.position % this.interval) === 0) {
            break;
        }
    }
    var end = Math.min(this.max, this.position),
        data;
    if (this._readableState.encoding) {
        data = this.buffer.slice(start, end).toString(this.encoding);
    } else {
        data = this.buffer.slice(start, end);
    }
    this.emit('data', data);
    process.nextTick(function() {
        //don't trigger readable if we're already done
        if (this.done) {
            return;
        }
        this.read();
    }.bind(this));
};
DataEmitter.prototype.begin = function() {
    process.nextTick(function() {
        this.read();
    }.bind(this));
};
DataEmitter.prototype.close = function() {
    process.nextTick(function() {
        this.emit('close');
    }.bind(this));
};
module.exports = DataEmitter;
