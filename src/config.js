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
  feePercentage: makePercentage(0.5),
  capital: 50,
  assets: 0,
  interval: intervalSeconds(5),
  backupInterval: intervalSeconds(10),
  buyMode: makeModeConfig(50, 5, 1.5),
  sellMode: makeModeConfig(50, 5, 1.5),
});

module.exports = config;
