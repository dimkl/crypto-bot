const { Balance, Price, Transaction, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { markSelling, markSold, improveSellOffer, hasEnoughToTrade } = require('./helpers');

class SellService {
  constructor(config, api) {
    this.config = config;
    this.api = api;
  }

  canBeTriggered() {
    const { tradePercentage, currencyPair } = this.config;
    const { currentAsk, hourlyOpen } = Price.find({ currencyPair }).value();
    const { assets } = Balance.find({ currencyPair }).value();
    const { exchangeRate: lastBoughtBid } = Transaction.find({ currencyPair, type: 'buy' }).value();

    const isValueRising = currentAsk >= hourlyOpen;
    const hasAssets = assets > 0;

    if (!isValueRising || !lastBoughtBid || !hasAssets) return false;

    const tradeableAssets = tradePercentage * assets;
    const {
      assets: assetsToSell,
      value: valueToSell
    } = improveSellOffer(currentAsk, tradeableAssets);

    if (!hasEnoughToTrade(valueToSell, assetsToSell)) return false;

    return true;
  }

  async process() {
    if (!this.canBeTriggered()) return false;

    const { changePercentage, comebackPercentage, tradePercentage, currencyPair } = this.config;
    const { currentAsk } = Price.find({ currencyPair }).value();
    const { assets, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();
    const { exchangeRate: lastBoughtBid } = Transaction.find({ currencyPair, type: 'buy' }).value();
    const { current: selling } = State.find({ currencyPair, mode: 'sell' }).value();

    const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);

    const percent = selling ? comebackPercentage : targetWithFee;
    // TODO: fix this, there seems to be an issue in bitstamp causing by the rounding
    // and we cannot sell the whole amount of assets
    const tradeableAssets = tradePercentage * assets;
    const {
      assets: assetsToSell,
      value: valueToSell
    } = improveSellOffer(currentAsk, tradeableAssets);

    // TODO: consider using the hourlyAsk

    const targetProfitReached = hasIncreasedFor(currentAsk, lastBoughtBid, percent);
    const recoveryReached = hasDecreasedFor(currentAsk, selling, comebackPercentage);
    if (selling) {
      const askHasRisen = currentAsk > selling;

      if (recoveryReached && targetProfitReached) {
        const { soldValue, soldAmount } = await this.api.sell(valueToSell, assetsToSell);
        await markSold(currencyPair, soldValue, soldAmount);
      } else if (askHasRisen) {
        await markSelling(currencyPair, currentAsk, assetsToSell);
      }
    } else if (targetProfitReached) {
      await markSelling(currencyPair, currentAsk, assetsToSell);
    }

    return true;
  }
}

module.exports = SellService;
