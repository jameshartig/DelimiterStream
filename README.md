DelimiterStream
===============

Get delimiter-separated (e.g. new line) chunks of data from a Readable Stream in Node.js. As bytes are received
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
function (readableStream, delimiter, encoding, oldStream)
```

* *readableStream* is a Readable Stream that emits a "readable" event and has a read function.
* *delimiter* is the character or byte that splits the data and triggers a "data" event.
* *encoding* is the encoding of the stream. Defaults to "binary".
* *oldStream* **DEPRECATED** should be set to true if you're passing a stream that emits "data" events instead of the new "readable" events.
* *initialBuffer* is an initial amount of data that was received before making the DelimiterStream. *(Not recommended)*

Once you've added your "data" listener and you're ready to start receiving data, call resume().

###resume
```
function ()
```

Starts emitting "data" events with chunks based on the delimiter. Any pending chunks will
cause "data" events to be emitted immediately.

###pause
```
function ()
```

Stop emitting "data" events until resume is called.


###addListener
```
function (type, listener)
```

Add a `listener` for a `type` event. All events from the underlying stream are bubbled up to listeners on the DelimiterStream.

###destroy
```
function ()
```

Removes any listeners we had on the underlying stream. Also removes any listeners you've added
to this DelimiterStream. Call this when you're done with a stream and want to have it cleaned up.
**Will be automatically called when the underlying stream emits "close".**

Example
-------
See example.js. Prints out data it received before an enter press (newline).

```
$ node example.js
Hello
Received: Hello
```

