var util = require('util'),
    events = require('events');

function FakeOldReader(enc, n, i) {
    events.EventEmitter.apply(this);

    n = n || 1000;
    this.buffer = new Buffer(n);
    this.buffer.fill(48); //"0"
    this.position = 0;
    this.max = n;
    this.interval = i || 250; //interval which causes a break in the read loop
    this.encoding = enc;
}
util.inherits(FakeOldReader, events.EventEmitter);

FakeOldReader.prototype.write = function() {
    if (this.encoding) {
        this.buffer.write.apply(this.buffer, Array.prototype.slice.call(arguments, 0));
    } else {
        this.buffer[arguments[1]] = arguments[0];
    }
};

FakeOldReader.prototype.sendData = function(n) {
    if (this.position >= this.max) {
        this.emit('done', true); //yes this is old
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
    this.emit('data', resp);

    setTimeout(function() {
        this.sendData();
    }.bind(this), 20);
};
FakeOldReader.prototype.begin = function() {
    process.nextTick(function() {
        this.sendData();
    }.bind(this));
};
FakeOldReader.prototype.close = function() {
    process.nextTick(function() {
        this.emit('close');
    }.bind(this));
};
FakeOldReader.prototype.resume = function() {};
module.exports = FakeOldReader;
