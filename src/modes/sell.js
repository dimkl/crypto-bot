const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');


function markSelling(value, currencyPair) {
  console.log('mark selling: ', { value, currencyPair, now: new Date() });
  Object.assign(DB[currencyPair].state, { selling: value });
}

function markSold(value, currencyPair) {
  console.log('mark sold: ', { value, currencyPair, now: new Date() });
  Object.assign(DB[currencyPair].state, { sold: value, selling: null });
}

async function sellMode(config) {
  const { changePercentage, comebackPercentage, tradePercentage } = config.sellMode;
  const { currencyPair } = config;
  const { currentAsk, hourlyAsk, assets, feePercentage = 0.0 } = DB[currencyPair];
  const { selling, bought } = DB[currencyPair].state;

  const isValueRising = currentAsk >= hourlyAsk;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasAssets = assets > 0;

  if (!isValueRising || !bought) {
    return;
  }
  if (!hasAssets) {
    console.log('Not enough assets!');
    return;
  }

  const percent = selling ? comebackPercentage : targetWithFee;
  const initial = selling ? selling : bought;
  const askHasRisen = currentAsk > selling;

  // TODO: consider using the hourlyAsk

  if (hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(currentAsk, currencyPair);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const { soldValue } = await sell(currentAsk, tradePercentage, currencyPair);
    await markSold(soldValue, currencyPair);
  } else if (askHasRisen) {
    await markSelling(currentAsk, currencyPair);
  }
}

module.exports = sellMode;
