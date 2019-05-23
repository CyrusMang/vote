const server = require('http').Server();
const io = require('socket.io')(server);
const config = require('./config');
const Counter = require('./modules/counter');

(async () => {
    try {
        const counter = await Counter.mount();
        
        server.listen(config.port);
        
        io.on('connection', socket => {
            socket.on('ready', () => {
                socket.emit('state', counter.result());
            });
            socket.on('vote', (campagin_id, user_idcard, candidate_id, res) => {
                counter.vote(campagin_id, user_idcard, candidate_id, (result, e) => {
                    res(result, e);
                    if (!e) {
                        socket.broadcast.emit('state', counter.result());
                    }
                });
            });
        });
    } catch (e) {
        console.error(e);
    }
})();