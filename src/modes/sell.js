const { Balance, Price, Transaction, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');

function markSelling(currencyPair, value, amount) {
  console.log('mark selling: ', { currencyPair, value, now: new Date(), amount });
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: value, amount, updatedAt: new Date() })
    .write();
}

function markSold(currencyPair, value, amount) {
  console.log('mark sold: ', { currencyPair, value, now: new Date(), amount });
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: null, final: value, amount, updatedAt: new Date() })
    .write();
}

async function sellMode(currencyPair, config) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentAsk, hourlyAsk } = Price.find({ currencyPair }).value();
  const { assets, feePercentage } = Balance.find({ currencyPair }).value();
  const { assets: lastBoughtAssets, exchangeRate: lastBoughtBid } = Transaction.find({ currencyPair, type: 'buy' }).value();
  const { current: selling } = State.find({ currencyPair, mode: 'sell' }).value();

  const isValueRising = currentAsk >= hourlyAsk;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasAssets = assets > 0;

  if (!isValueRising || !lastBoughtBid || !hasAssets) {
    return;
  }

  const percent = selling ? comebackPercentage : targetWithFee;
  const initial = selling ? selling : lastBoughtBid;
  const askHasRisen = currentAsk > selling;
  const assetsToSell = (tradePercentage * lastBoughtAssets).toFixed(4);

  // TODO: consider using the hourlyAsk

  if (hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const { soldValue, soldAmount } = await sell(currentAsk, assetsToSell, currencyPair);
    await markSold(currencyPair, soldValue, soldAmount);
  } else if (askHasRisen) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  }
}

module.exports = sellMode;
