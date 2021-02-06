const { makeModeConfig, intervalSeconds } = require('../helpers');

const db = require('../storage');

const Config = db.defaults({
  config: [
    {
      currencyPair: 'xlmeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 2, 0.5),
      sellMode: makeModeConfig(100, 2, 0.5),
    },
    {
      currencyPair: 'xrpeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(100, 2, 0.5),
      sellMode: makeModeConfig(100, 2, 0.5),
    },
    {
      currencyPair: 'btceur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(50, 2, 0.5),
      sellMode: makeModeConfig(50, 2, 0.5),
    }
  ]
}).get('config');

module.exports = Config;