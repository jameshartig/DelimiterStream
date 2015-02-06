var util = require('util'),
    events = require('events');

function FakeReader(enc, n, i) {
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
util.inherits(FakeReader, events.EventEmitter);

FakeReader.prototype.write = function() {
    if (this._readableState.encoding) {
        this.buffer.write.apply(this.buffer, Array.prototype.slice.call(arguments, 0));
    } else {
        this.buffer[arguments[1]] = arguments[0];
    }
};
FakeReader.prototype.setEncoding = function(encoding) {
    this._readableState.encoding = encoding;
};

FakeReader.prototype.read = function(n) {
    if (this.position >= this.max) {
        this.done = true;
        this.emit('done', false); //not old style
        return null;
    }

    n = n || this.max;
    var start = this.position;
    while (this.position++ < this.max && (this.position - start) <= n) {
        if ((this.position % this.interval) === 0) {
            break;
        }
    }
    var resp;
    if (this._readableState.encoding) {
        resp = this.buffer.slice(start, this.position).toString(this.encoding);
    } else {
        resp = this.buffer.slice(start, this.position);
    }
    process.nextTick(function() {
        //don't trigger readable if we're already done
        if (this.done) {
            return;
        }
        this.emit('readable');
    }.bind(this));
    return resp;
};
FakeReader.prototype.begin = function() {
    process.nextTick(function() {
        this.emit('readable');
    }.bind(this));
};
FakeReader.prototype.close = function() {
    process.nextTick(function() {
        this.emit('close');
    }.bind(this));
};
module.exports = FakeReader;
