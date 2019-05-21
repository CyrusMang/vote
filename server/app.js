const app = require('http').createServer();
const io = require('socket.io')(app);
const config = require('./config');
const Counter = require('./modules/counter');

(async () => {
    try {
        const counter = await Counter.mount();
        
        app.listen(config.port);
        
        io.on('connection', socket => {
            socket.emit('state', counter.state);
            socket.on('vote', (campagin_id, user_idcard, candidate_id, res) => {
                counter.vote(campagin_id, user_idcard, candidate_id, (result, e) => {
                    res(result, e);
                    if (!e) {
                        socket.broadcast.emit('state', counter.state);
                    }
                });
            });
        });
    } catch (e) {
        console.error(e);
    }
})();