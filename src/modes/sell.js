const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');

function markSelling(state, value) {
  console.log('mark selling: ', { value, now: new Date() });
  Object.assign(state, { selling: value });
}

function markSold(state, value, amount) {
  console.log('mark sold: ', { value, now: new Date(), amount });
  Object.assign(state, { sold: value, selling: null });
}

async function sellMode(currencyPair, config, state) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentAsk, hourlyAsk, assets, lastBoughtBid, lastBoughtAssets, feePercentage = 0.0 } = DB[currencyPair];
  const { selling } = state;

  const isValueRising = currentAsk >= hourlyAsk;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasAssets = assets > 0;

  if (!isValueRising || !lastBoughtBid || !hasAssets) {
    return;
  }

  const percent = selling ? comebackPercentage : targetWithFee;
  const initial = selling ? selling : lastBoughtBid;
  const askHasRisen = currentAsk > selling;

  // TODO: consider using the hourlyAsk

  if (hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(state, currentAsk);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const assetsToSell = (tradePercentage * lastBoughtAssets).toFixed(4);
    const { soldValue, soldAmount } = await sell(currentAsk, assetsToSell, currencyPair);
    await markSold(state, soldValue, soldAmount);
  } else if (askHasRisen) {
    await markSelling(state, currentAsk);
  }
}

module.exports = sellMode;
