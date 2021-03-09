function makePercentage(number) {
  return (number / 100).toFixed(4);
}

function intervalSeconds(seconds) {
  return seconds * 1000;
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
  return ['', 'production'].includes(process.env.NODE_ENV || '')
}

function makeModeConfig(trade, change, comeback) {
  return {
    tradePercentage: makePercentage(trade),
    changePercentage: makePercentage(change),
    comebackPercentage: makePercentage(comeback)
  };
}

function splitCurrencies(currencyPair) {
  if (currencyPair.includes('/')) {
    return currencyPair.split('/');
  }

  if (currencyPair.length != 6 ) {
    const indexOfCapital = currencyPair.length - 3;
    return [currencyPair.slice(0, indexOfCapital), currencyPair.slice(indexOfCapital)];
  }

  return [currencyPair.slice(0, 3), currencyPair.slice(3)];
}

function handleErrorResponse(err) {
  const { statusCode, body } = err.response || {};
  const { requestUrl } = err.request || {};

  if (err.name.includes('Timeout')) {
    console.log({ requestUrl, timings: JSON.stringify(err.timings) });
  } else if (statusCode) {
    console.log({ requestUrl, statusCode, body });
  } else {
    console.error(err);
  }
}

function convertCurrencyToISO4217(currencyPair) {
  return splitCurrencies(currencyPair).map(s => s.toUpperCase()).join('/');
}

module.exports = {
  convertCurrencyToISO4217,
  getChangePercentage,
  handleErrorResponse,
  hasDecreasedFor,
  hasIncreasedFor,
  intervalSeconds,
  isLive,
  makePercentage,
  makeModeConfig,
  sliceObject,
  splitCurrencies,
};
