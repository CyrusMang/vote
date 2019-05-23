const mysql = require('mysql2');
const config = require('../config');

const db = mysql.createPool(config.database.options).promise();

db.q = async (sql, values, tried=0) => {
    try {
        return await db.query(sql, values);
    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            if (config.database.retry > tried) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(db.q(sql, values, tried+1));
                    }, 10000);
                })
            }
        }
        throw e;
    }
}

module.exports = db;