const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const dbSuffix = process.env.NODE_ENV ? '.' + process.env.NODE_ENV : '';
const adapter = new FileSync(`./db${dbSuffix}.json`)
const db = low(adapter);

module.exports = db;