var fs = require("fs"),
    DelimiterStream = require("./DelimiterStream"),
    fdStream = new fs.ReadStream(null, {fd: 0});

fdStream.setEncoding('utf8');
var d = new DelimiterStream(fdStream, "\n", "utf8");
d.on('data', function(data) {
    console.log("Received:", data);
});
d.resume();