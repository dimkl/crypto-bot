const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');

function markSelling(state, value) {
  console.log('mark selling: ', { value, now: new Date() });
  Object.assign(state, { selling: value });
}

function markSold(state, value) {
  console.log('mark sold: ', { value, now: new Date() });
  Object.assign(state, { sold: value, selling: null });
}

async function sellMode(currencyPair, config, state) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentAsk, hourlyAsk, assets, feePercentage = 0.0 } = DB[currencyPair];
  const { selling, bought } = state;

  const isValueRising = currentAsk >= hourlyAsk;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasAssets = assets > 0;

  if (!isValueRising || !bought) {
    return;
  }
  if (!hasAssets) {
    console.log(`Not enough ${currencyPair} assets!`, state);
    return;
  }

  const percent = selling ? comebackPercentage : targetWithFee;
  const initial = selling ? selling : bought;
  const askHasRisen = currentAsk > selling;

  // TODO: consider using the hourlyAsk

  if (hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(state, currentAsk);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const { soldValue } = await sell(currentAsk, tradePercentage, currencyPair);
    await markSold(state, soldValue);
  } else if (askHasRisen) {
    await markSelling(state, currentAsk);
  }
}

module.exports = sellMode;
