const { writeFileSync } = require('fs');

const DB = require('../db');

function snapshotDB() {
  writeFileSync('db.json', JSON.stringify(DB, null, 2));
}

module.exports = snapshotDB;