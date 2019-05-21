const mysql = require('mysql2');
const config = require('../config');

class Counter {
    constructor(db) {
        this.db = db;
        this.state = {};
        this.queue = [];
        this.running = false;
        this.mounted_at = new Date();
    }
    vote(campagin_id, user_idcard, candidate_id, res) {
        if (this.queue.length >= config.queue_limit) {
            return reject('Sorry, our server is busy. please try again later.');
        }
        this.queue.push({data: [campagin_id, user_idcard, candidate_id], res});
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
    async add(campagin_id, user_idcard, candidate_id) {
        try {
            if (this.state[campagin].candidates.find(c => c.id === candidate)) {
                let user = await this.query('SELECT * FROM users WHERE idcard = ? LIMIT 1', [user_idcard]);
                if (!user) {
                    user = await this.query(`INSERT INTO users (idcard) VALUES (?)`, [user_idcard]);
                }
                try {
                    const campaigns = await this.query(`
                        INSERT INTO campaign_user (campaign_id, user_id, candidate_id) 
                        VALUES (?, ?, ?)
                    `, [campagin_id, user.id, candidate_id]);
                    return true;
                } catch (e) {
                    if (e.code === 'ER_DUP_ENTRY') {
                        return false;
                    }
                    throw e;
                }
            }
        } catch (e) {
            throw e;
        }
    }
    async refresh() {
        try {
            const campaigns = await this.query('SELECT * FROM campaigns');
            for (let campaign of campaigns) {
                const votes = await this.query(`SELECT * FROM campaign_user WHERE campaign_id = ?`, [campaign.id]);
                let count = {}
                for (let vote of votes) {
                    count[vote.candidate_id] = (count[vote.candidate_id] || 0) + 1;
                }
                this.state[campaign.id] = {
                    title: campaign.title,
                    candidates: campaign.candidates.map(c => {
                        c.votes = count[vote.candidate_id] || 0;
                        return c
                    }),
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                }
            }
        } catch (e) {
            throw e;
        }
    }
    static async mount() {
        try {
            const db = mysql.createPool(config.database.options);
            const counter = new Counter(db.promise());
            await counter.refresh();
            return counter;
        } catch (e) {
            throw e;
        }
    }
};

module.export = Counter;