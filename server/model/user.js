const Model = require('./_model');
const db = require('../helpers/database');

class User extends Model {
    static async find_or_create(idcard) {
        try {
            let result = await db.q('SELECT * FROM users WHERE idcard = ? LIMIT 1', [idcard]);
            if (result[0].length) {
                return new User(result[0][0]);
            }
            result = await db.q(`INSERT INTO users (idcard) VALUES (?)`, [idcard]);
            return new User({
                idcard,
                id: result[0].insertId
            })
        } catch (e) {
            throw new Error('User create failure')
        }
    }
}

module.exports = User;