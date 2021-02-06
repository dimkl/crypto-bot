const got = require('got');

module.exports = got.extend({ timeout: 4000 });
