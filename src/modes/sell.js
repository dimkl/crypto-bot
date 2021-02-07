const { Balance, Price, Transaction, State, AuditLog } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');

function markSelling(currencyPair, value, amount) {
  console.log('mark selling: ', { currencyPair, value, now: new Date(), amount });
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: value, final: null, amount, updatedAt: new Date() })
    .write();
}

function markSold(currencyPair, value, amount) {
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: null, final: value, amount, updatedAt: new Date() })
    .write();
  AuditLog
    .push({ mode: 'sell', currencyPair, value, amount, createdAt: new Date() })
    .write();
}

async function sellMode(currencyPair, config) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentAsk, hourlyOpen } = Price.find({ currencyPair }).value();
  const { assets, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();
  const { assets: lastBoughtAssets, exchangeRate: lastBoughtBid } = Transaction.find({ currencyPair, type: 'buy' }).value();
  const { current: selling } = State.find({ currencyPair, mode: 'sell' }).value();

  const isValueRising = currentAsk >= hourlyOpen;
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

  if (!selling && hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const { soldValue, soldAmount } = await sell(currentAsk, assetsToSell, currencyPair);
    await markSold(currencyPair, soldValue, soldAmount);
  } else if (askHasRisen) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  }
}

module.exports = sellMode;
