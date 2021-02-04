const { makePercentage, intervalSeconds } = require('./helpers');

function makeModeConfig(trade, change, comeback) {
  return {
    tradePercentage: makePercentage(trade),
    changePercentage: makePercentage(change),
    comebackPercentage: makePercentage(comeback)
  };
}

const config = Object.freeze({
  interval: intervalSeconds(5),
  buyMode: makeModeConfig(75, 2, 0.5),
  sellMode: makeModeConfig(75, 2, 0.5),
});

module.exports = config;
