function makePercentage(n) {
  return (n / 100).toFixed(4);
}

function intervalSeconds(s) {
  return s * 1000;
}

function sliceObject(obj, keys) {
  return keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});
}

function getChangePercentage(initial, current) {
  if (!initial || !current) return 0;
  return parseFloat((current - initial) / initial).toFixed(4);
}

function hasIncreasedFor(current, initial, percent) {
  const change = getChangePercentage(initial, current);
  return change > 0 && change >= percent;
}

function hasDecreasedFor(current, initial, percent) {
  const change = getChangePercentage(current, initial);
  return change > 0 && change >= percent;
}

function isLive() {
  return !["test", "development"].includes(process.env.NODE_ENV)
}

function makeModeConfig(trade, change, comeback) {
  return {
    tradePercentage: makePercentage(trade),
    changePercentage: makePercentage(change),
    comebackPercentage: makePercentage(comeback)
  };
}

function splitCurrencies(currencyPair) {
  return [currencyPair.slice(0, 3), currencyPair.slice(3)];
}

module.exports = {
  makePercentage,
  intervalSeconds,
  isLive,
  sliceObject,
  getChangePercentage,
  hasIncreasedFor,
  hasDecreasedFor,
  makeModeConfig,
  splitCurrencies
};
