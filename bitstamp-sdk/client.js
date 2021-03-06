const got = require('got');
const CacheableLookup = require('cacheable-lookup');

const dnsCache = new CacheableLookup();

module.exports = got.extend({
  dnsCache,
  timeout: 1000,
  retry: { limit: 2, methods: ['GET'] }
});
