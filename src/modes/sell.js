const { Balance, Price, Transaction, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const Api = require('../adapters/bitstamp');
const { markSelling, markSold, improveSellOffer, hasEnoughToTrade } = require('./helpers');

async function sellMode(config) {
  const { changePercentage, comebackPercentage, tradePercentage, currencyPair } = config;
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

  if (!hasEnoughToTrade(valueToSell, assetsToSell)) return;

  const targetProfitReached = hasIncreasedFor(currentAsk, lastBoughtBid, percent);
  const recoveryReached = hasDecreasedFor(currentAsk, selling, comebackPercentage);
  if (selling) {
    if (recoveryReached && targetProfitReached) {
      const api = Api.getInstance(config);
      const { soldValue, soldAmount } = await api.sell(valueToSell, assetsToSell);
      await markSold(currencyPair, soldValue, soldAmount);
    } else if (askHasRisen) {
      await markSelling(currencyPair, currentAsk, assetsToSell);
    }
  } else if (targetProfitReached) {
    await markSelling(currencyPair, currentAsk, assetsToSell);
  }
}

module.exports = sellMode;
