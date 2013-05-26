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
    this.encoding = enc;
}
util.inherits(FakeReader, events.EventEmitter);

FakeReader.prototype.write = function() {
    if (this.encoding) {
        this.buffer.write.apply(this.buffer, Array.prototype.slice.call(arguments, 0));
    } else {
        this.buffer[arguments[1]] = arguments[0];
    }
};

FakeReader.prototype.read = function(n) {
    if (this.position >= this.max) {
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
    var resp;
    if (this.encoding) {
        resp = this.buffer.slice(start, this.position).toString(this.encoding);
    } else {
        resp = this.buffer.slice(start, this.position);
    }
    setTimeout(function() {
        this.emit('readable');
    }.bind(this), 20);
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
