const got = require('got');
const CacheableLookup = require('cacheable-lookup');

const dnsCache = new CacheableLookup();

module.exports = got.extend({
  dnsCache,
  timeout: 2000,
  retry: {
    limit: 1,
    methods: ['GET'],
  }
});
