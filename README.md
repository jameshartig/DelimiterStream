DelimiterStream
===============

Get delimiter-separated chunks of data from a Readable Stream in Node.js. As bytes are received
through the stream, a "data" event will be emitted whenever the delimiter is seen. The event
will contain the chunk of data after the last delimiter and before the one just seen. The
chunk will **NOT include the delimiter**.

### Install
Doesn't require any dependencies. You can either just install via npm:

```
npm install delimiterstream
```

or

```
var DelimiterStream = require("./DelimiterStream/DelimiterStream.js");
```

Methods
-------

### Constructor
```
function (readableStream, delimiter, encoding)
```

* *readableStream* is a Readable Stream that emits a "readable" event and has a read function.
* *delimiter* is the character or byte that splits the data and triggers a "data" event.
* *encoding* is the encoding of the stream. Defaults to "binary".

Once you've added your "data" listener, call resume().

###resume
```
function ()
```

Starts emitting "data" events with chunks based on the delimiter. Any pending chunks will
cause "data" events to be emitted immediately.

Example
-------
See example.js. Prints out data it received before an enter press (newline).

```
$ node example.js
Hello
Received: Hello
```

