const app = require('http').createServer();
const io = require('socket.io')(app);
const mysql = require('mysql2');

const config = {
    port: 8080,
    queue_limit: 1000,
    database: {
        options: {
            host: 'mysql',
            user: 'vote',
            password: 'i348yr3894769487r907340uf90',
            database: 'vote',
        },
        retry: 3,
    },
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
    async query(sql, values, tried=0) {
        try {
            return await this.db.query(sql, values);
        } catch (e) {
            if (e.code === 'ECONNREFUSED') {
                if (config.database.retry > tried) {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(this.query(sql, values, tried+1));
                        }, 10000);
                    })
                }
            }
            throw e;
        }
    }
    async add(campagin, candidate, user) {
        // TODO add vote to db and update state
    }
    async refresh() {
        try {
            const campaigns = await this.query('SELECT * FROM `campaigns`');
            for (let campaign of campaigns) {
                console.log(campaign);
            }
        } catch (e) {
            throw e;
        }
    }
    static async mount() {
        try {
            const db = await mysql.createPool(config.database.options);
            const counter = new Counter(db.promise());
            await counter.refresh();
            return counter;
        } catch (e) {
            throw e;
        }
    }
};

(async () => {
    try {
        const counter = await Counter.mount(config.database);
        
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