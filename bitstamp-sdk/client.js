const got = require('got');

module.exports = got.extend({
  timeout: 4000,
  retry: {
    limit: 1,
    methods: ['GET'],
    errorCodes: ['ETIMEDOUT']
  }
});
