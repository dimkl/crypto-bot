const { makePercentage, intervalSeconds } = require('./helpers');

function makeModeConfig(trade, change, comeback) {
  return {
    tradePercentage: makePercentage(trade),
    changePercentage: makePercentage(change),
    comebackPercentage: makePercentage(comeback)
  };
}

const config = Object.freeze({
  currencyPair: 'xlmeur',
  interval: intervalSeconds(5),
  backupInterval: intervalSeconds(10),
  buyMode: makeModeConfig(50, 2, 0.5),
  sellMode: makeModeConfig(50, 2, 0.5),
});

module.exports = config;
