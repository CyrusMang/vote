const mysql = require('mysql2');
const config = require('../config');
const User = require('../models/user');
const Campaign = require('../models/campaign');

class Counter {
    constructor() {
        this.state = {};
        this.queue = [];
        this.running = false;
        this.mounted_at = new Date();
    }
    vote(campaign_id, user_idcard, candidate_id, res) {
        if (this.queue.length >= config.queue_limit) {
            return res(null, {message: 'Sorry, our server is busy. please try again later.'});
        }
        if (!/^[a-zA-Z][0-9]{7}/i.test(String(user_idcard))) {
            return res(null, {message: 'Invalid ID card number, ex: Y0012345'});
        }
        const now = new Date();
        const campaign = this.state.campaigns.find(c => c.data.id === campaign_id);
        if (campaign.activated()) {
            const candidate = campaign.candidate(candidate_id);
            if (candidate) {
                this.queue.push({data: [campaign.data.id, user_idcard, candidate.id], res});
                if (!this.running) {
                    this.process();
                }
                return;
            }
        }
        res(null, {message: 'Invalid vote'});
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
            .catch((e) => {
                console.error(e);
                next.res(null, {message: 'Internal Server Error'});
            });
            this.process();
            return
        }
        this.running = false;
    }
    result() {
        return {
            campaigns: this.state.campaigns.map(c => c.data)
        }
    }
    async add(campaign_id, user_idcard, candidate_id) {
        try {
            const campaign = this.state.campaigns.find(c => c.data.id === campaign_id);
            if (!campaign) {
                throw new Error(`Campaign(${campaign_id}) not found`);
            }
            const user = await User.find_or_create(user_idcard);
            if (await campaign.is_voted(user)) {
                return false
            }
            await campaign.vote(user, candidate_id);
            return true;
        } catch (e) {
            throw e;
        }
    }
    async refresh() {
        try {
            if (this.queue.length) {
                throw new Error('Vote request(s) processing, please try again later.')
            }
            this.state.campaigns = await Campaign.fetch();
        } catch (e) {
            throw e;
        }
    }
    static async mount() {
        try {
            const counter = new Counter();
            await counter.refresh();
            return counter;
        } catch (e) {
            throw e;
        }
    }
};

module.exports = Counter;