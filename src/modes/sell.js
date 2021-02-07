const { Balance, Price, Transaction, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');
const { markSelling, markSold } = require('./helpers');

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
  // TODO: fix this, there seems to be an issue in bitstamp causing by the rounding
  // and we cannot sell the whole amount of assets
  const usefulTradePercentage = parseFloat(tradePercentage) - 0.0001;
  const assetsToSell = (usefulTradePercentage * lastBoughtAssets).toFixed(4);

  // TODO: consider using the hourlyAsk

  if (!selling && hasIncreasedFor(currentAsk, initial, percent)) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  } else if (selling && hasDecreasedFor(currentAsk, selling, comebackPercentage)) {
    const { soldValue, soldAmount } = await sell(currentAsk, assetsToSell, currencyPair);
    await markSold(currencyPair, soldValue, soldAmount);
  } else if (selling && askHasRisen) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  }
}

module.exports = sellMode;
