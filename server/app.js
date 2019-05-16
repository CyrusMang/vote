var net = require('net');

net.createServer(socket => {
    console.log("connected");

    socket.on('data', data => {
        console.log(data.toString());
    });
}).listen(8080);