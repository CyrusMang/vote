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
    vote(campaign_id, user_idcard, candidate_id, res) {
        if (this.queue.length >= config.queue_limit) {
            return res(null, {message: 'Sorry, our server is busy. please try again later.'});
        }
        this.queue.push({data: [campaign_id, user_idcard, candidate_id], res});
        if (!this.running) {
            this.process();
        }
    }
    process() {
        this.running = true;
        const next = this.queue.shift();
        if (next) {
            this.add(...next.data)
            .then(result => {
                if (result) {
                    next.res({message: 'Voted'});
                } else {
                    next.res(null, {message: 'Duplicate vote'});
                }
            })
            .catch(() => {
                next.res(null, {message: 'Internal Server Error'})
            });
            this.process();
            return
        }
        this.running = false;
    }
    async add(campaign_id, user_idcard, candidate_id) {
        try {
            const campaign = this.state.campaigns.find(c => c.id === campaign_id);
            if (campaign) {
                const candidate = campaign.candidates.find(c => c.id === candidate_id);
                if (candidate) {
                    const user = await this.query('SELECT * FROM users WHERE idcard = ? LIMIT 1', [user_idcard]);
                    let user_id = user[0].length ? user[0][0].id : null;
                    if (user_id) {
                        const voted = await this.query(`
                            SELECT * FROM campaign_user WHERE user_id = ? AND campaign_id = ? LIMIT 1
                        `, [user_id, campaign.id]);
                        if (voted[0].length) {
                            return false;
                        }
                    } else {
                        const result = await this.query(`INSERT INTO users (idcard) VALUES (?)`, [user_idcard]);
                        user_id = result[0].insertId;
                    }
                    await this.query(`
                        INSERT INTO campaign_user (campaign_id, user_id, candidate_id) 
                        VALUES (?, ?, ?)
                    `, [campaign.id, user_id, candidate.id]);
                    candidate.votes++
                    return true;
                }
            }
            throw new Error('Campagin or candidate not found');
        } catch (e) {
            throw e;
        }
    }
    async refresh() {
        try {
            this.state.campaigns = [];
            const campaigns = await this.query('SELECT * FROM campaigns');
            for (let campaign of campaigns[0]) {
                const votes = await this.query(`SELECT * FROM campaign_user WHERE campaign_id = ?`, [campaign.id]);
                let count = {}
                for (let vote of votes[0]) {
                    count[vote.candidate_id] = (count[vote.candidate_id] || 0) + 1;
                }
                this.state.campaigns.push({
                    id: campaign.id,
                    title: campaign.title,
                    candidates: JSON.parse(campaign.candidates).map(c => {
                        c.votes = count[c.id] || 0;
                        return c
                    }),
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                });
            }
        } catch (e) {
            throw e;
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

module.exports = Counter;