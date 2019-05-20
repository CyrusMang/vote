const app = require('http').createServer();
const io = require('socket.io')(app);
const Counter = require('../modules/counter');

(async () => {
    try {
        const counter = await Counter.mount();
        
        app.listen(config.port);
        
        io.on('connection', socket => {
            socket.on('vote', (campagin, candidate, user, res) => {
                counter.vote(campagin, candidate, user, (result, e) => {
                    res(result, e);
                    if (!e) {
                        socket.broadcast.emit('state', counter.result);
                    }
                });
            });
        });
    } catch (e) {
        console.error(e);
    }
})();