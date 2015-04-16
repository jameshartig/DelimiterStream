var fs = require('fs'),
    DelimiterStream = require('./DelimiterStream.js');
fs.readFile('./example.csv', DelimiterStream.wrap(function(line) {
    console.log(line.toString());
}));

var net = require('net'),
    server = net.createServer();
function onSocketLine(line) {
    console.log('Received line from', this.remoteAddress, line);
}
server.on('connection', function(socket) {
    socket.on('data', DelimiterStream.wrap(onSocketLine, socket));
});
server.listen(3000);
