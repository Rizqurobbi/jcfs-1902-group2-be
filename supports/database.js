const mysql = require ('mysql');
const util = require ('util')

const db = mysql.createPool({
    connectionLimit: 1000,
    connectionTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
})

const dbQuery = util.promisify(db.query).bind(db);

module.exports = { db, dbQuery }