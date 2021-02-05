const { makeModeConfig, intervalSeconds } = require('./helpers');

const config = Object.freeze({
  interval: intervalSeconds(5),
  buyMode: makeModeConfig(75, 2, 0.5),
  sellMode: makeModeConfig(75, 2, 0.5),
});

module.exports = config;
