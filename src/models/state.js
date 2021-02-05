const db = require('../storage');

const State = db.defaults({
  states: []
}).get('states');

module.exports = State;