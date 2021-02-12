const { Balance, Price, Transaction, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { sell } = require('../adapters/bitstamp');
const { markSelling, markSold } = require('./helpers');

function improveSellOffer(value, assets) {
  return {
    value: (value * 0.999).toFixed(5),
    assets: (assets * 0.999).toFixed(4)
  };
}

function hasEnoughToSell(value, assets){
    return (value * assets) >= 25;
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

  if (!isValueRising || !lastBoughtBid || !hasAssets) return;

  const percent = selling ? comebackPercentage : targetWithFee;
  const askHasRisen = currentAsk > selling;
  // TODO: fix this, there seems to be an issue in bitstamp causing by the rounding
  // and we cannot sell the whole amount of assets
  const tradeableAssets = tradePercentage * assets;
  const {
    assets: assetsToSell,
    value: valueToSell
  } = improveSellOffer(currentAsk, tradeableAssets);

  // TODO: consider using the hourlyAsk
  
  if (!hasEnoughToSell(valueToSell, assetsToSell)) return;

  const targetProfitReached = hasIncreasedFor(currentAsk, lastBoughtBid, percent);
  const recoveryReached = hasDecreasedFor(currentAsk, selling, comebackPercentage);
  if (selling) {
    if (recoveryReached && targetProfitReached) {
      const { soldValue, soldAmount } = await sell(valueToSell, assetsToSell, currencyPair);
      await markSold(currencyPair, soldValue, soldAmount);
    } else if (askHasRisen) {
      await markSelling(currencyPair, currentAsk, assetsToSell);
    }
  } else if (targetProfitReached) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  }
}

module.exports = sellMode;
