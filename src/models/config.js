const { makeModeConfig, intervalSeconds } = require('../helpers');

const db = require('../storage');

const Config = db.defaults({
  config: [
    {
      currencyPair: 'xlmeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 4, 1),
      sellMode: makeModeConfig(100, 4, 1),
    },
    {
      currencyPair: 'xrpeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 4, 1),
      sellMode: makeModeConfig(100, 4, 1),
    },
    {
      currencyPair: 'btceur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 5, 1),
      sellMode: makeModeConfig(100, 8, 2),
    },
    {
      currencyPair: 'omgeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 5, 1),
      sellMode: makeModeConfig(100, 5, 1),
    }
  ]
}).get('config');

module.exports = Config;
