const got = require('got');
const CacheableLookup = require('cacheable-lookup');

const dnsCache = new CacheableLookup();

module.exports = got.extend({
  dnsCache,
  timeout: 4000,
  retry: {
    limit: 1,
    methods: ['GET'],
    errorCodes: ['ETIMEDOUT']
  }
});
