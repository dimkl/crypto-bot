const { makeModeConfig, intervalSeconds } = require('../helpers');

const db = require('../storage');

const Config = db.defaults({
  config: [
    {
      currencyPair: 'xlmeur',
      interval: intervalSeconds(3),
      buyMode: makeModeConfig(100, 5, 1.5),
      sellMode: makeModeConfig(100, 4, 1),
      auth: {}
    },
    {
      currencyPair: 'xrpeur',
      interval: intervalSeconds(3),
      buyMode: makeModeConfig(100, 5, 1.5),
      sellMode: makeModeConfig(100, 4, 1.5),
      auth: {}
    },
    {
      currencyPair: 'btceur',
      interval: intervalSeconds(3),
      buyMode: makeModeConfig(100, 5, 1),
      sellMode: makeModeConfig(100, 8, 2),
      auth: {}
    },
    {
      currencyPair: 'omgeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 5, 1.5),
      sellMode: makeModeConfig(100, 5, 1),
      auth: {}
    }
  ]
}).get('config');

module.exports = Config;
