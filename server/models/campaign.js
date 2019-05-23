const Model = require('./_model');
const db = require('../helpers/database');

class Campaign extends Model {

    candidate(id) {
        return this.data.candidates.find(c => c.id === id);
    }

    activated() {
        const now = new Date();
        return this.data.start_date < now && now < this.data.end_date;
    }

    async is_voted(user) {
        const voted = await db.q(`
            SELECT * FROM campaign_user WHERE user_id = ? AND campaign_id = ? LIMIT 1
        `, [user.data.id, this.data.id]);
        return voted[0].length > 0;
    }

    async vote(user, candidate_id) {
        try {
            const candidate = this.candidate(candidate_id);
            if (!candidate) {
                throw new Error(`Campaign(${this.data.id})'s Candidate(${candidate_id}) not found`);
            }
            await db.q(`
                INSERT INTO campaign_user (campaign_id, user_id, candidate_id) 
                VALUES (?, ?, ?)
            `, [this.data.id, user.data.id, candidate.id]);
            candidate.votes++;
        } catch (e) {
            throw e;
        }
    }

    static async fetch() {
        try {
            let result = [];
            const campaigns = await db.q('SELECT * FROM campaigns ORDER BY end_date');
            for (let campaign of campaigns[0]) {
                const votes = await db.q(`SELECT * FROM campaign_user WHERE campaign_id = ?`, [campaign.id]);
                let count = {}
                for (let vote of votes[0]) {
                    count[vote.candidate_id] = (count[vote.candidate_id] || 0) + 1;
                }
                result.push(new Campaign({
                    id: campaign.id,
                    title: campaign.title,
                    candidates: JSON.parse(campaign.candidates).map(c => {
                        c.votes = count[c.id] || 0;
                        return c
                    }),
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                }));
            }
            return result;
        } catch (e) {
            throw e;
        }
    }
}

module.exports = Campaign;