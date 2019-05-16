const app = require('http').createServer();
const io = require('socket.io')(app);

const config = {
    port: 8080,
    queue_limit: 1000,
};

class Counter {
    constructor(db) {
        this.db = db;
        this.state = {};
        this.queue = [];
        this.running = false;
        this.mounted_at = new Date();
    }
    vote(campagin, candidate, user, res) {
        if (this.queue.length >= config.queue_limit) {
            return reject('Sorry, our server is busy. please try again later.');
        }
        this.queue.push({data: [campagin, candidate, user], res});
        process();
    }
    async process() {
        try {
            if (!this.running) {
                this.running = true;
                const next = this.queue.shift();
                if (next) {
                    if (await this.add(...next.data)) {
                        next.res({message: 'Voted'});
                    } else {
                        next.res(null, {message: 'Duplicate vote'});
                    }
                    process();
                    return
                }
                this.running = false;
            }
        } catch (e) {
            console.error(e);
            next.res(null, {message: 'Internal Server Error'});
            process();
        }
    }
    async add(campagin, candidate, user) {
        // TODO add vote to db
    }
    async refresh() {
        // TODO fetch result data and set to state
    }
    async static mount(config) {
        try {
            const counter = new Counter();
            await counter.refresh();
        } catch (e) {
            throw e;
        }
    }
};

(async () => {
    try {
        const counter = await Counter.mount({});
        
        server.listen(config.port);
        
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