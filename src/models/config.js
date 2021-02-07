const { makeModeConfig, intervalSeconds } = require('../helpers');

const db = require('../storage');

const Config = db.defaults({
  config: [
    {
      currencyPair: 'xlmeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 4, 1),
      sellMode: makeModeConfig(100, 2.5, 1),
    },
    {
      currencyPair: 'xrpeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 4, 1),
      sellMode: makeModeConfig(100, 2.5, 1),
    },
    {
      currencyPair: 'btceur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(50, 4, 1),
      sellMode: makeModeConfig(50, 3, 1),
    },
    {
      currencyPair: 'omgeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(50, 8, 1),
      sellMode: makeModeConfig(50, 8, 2),
    }
  ]
}).get('config');

module.exports = Config;