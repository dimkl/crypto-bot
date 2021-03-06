const { Balance, Price, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { markBuying, markBought, improveBuyOffer, hasEnoughToTrade } = require('./helpers');

class BuyService {
  constructor(config, api) {
    this.config = config;
    this.api = api;
  }

  canBeTriggered() {
    const { tradePercentage, currencyPair } = this.config;
    const { currentBid, hourlyOpen } = Price.find({ currencyPair }).value();
    const { capital, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();

    const isValueDropping = currentBid <= hourlyOpen;
    const hasCapital = capital > 0;

    if (!isValueDropping || !hasCapital) return false;

    const usefulTradePercentage = parseFloat(tradePercentage) - parseFloat(feePercentage);
    const tradeableAssets = usefulTradePercentage * parseFloat(capital) / parseFloat(currentBid)
    const {
      assets: assetsToBuy,
      value: valueToBuy
    } = improveBuyOffer(currentBid, tradeableAssets);

    if (!hasEnoughToTrade(valueToBuy, assetsToBuy)) return false;

    return true;
  }

  async process() {
    if (!this.canBeTriggered()) return false;

    const { changePercentage, comebackPercentage, tradePercentage, currencyPair } = this.config;
    const { currentBid, hourlyOpen } = Price.find({ currencyPair }).value();
    const { capital, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();
    const { current: buying } = State.find({ currencyPair, mode: 'buy' }).value();

    const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);

    const percent = buying ? comebackPercentage : targetWithFee;
    const bidHasDropped = currentBid < buying;

    const usefulTradePercentage = parseFloat(tradePercentage) - parseFloat(feePercentage);
    const tradeableAssets = usefulTradePercentage * parseFloat(capital) / parseFloat(currentBid)
    const {
      assets: assetsToBuy,
      value: valueToBuy
    } = improveBuyOffer(currentBid, tradeableAssets);

    const targetProfitReached = hasDecreasedFor(currentBid, hourlyOpen, percent);
    const recoveryReached = hasIncreasedFor(currentBid, buying, comebackPercentage);
    if (buying) {
      if (recoveryReached && targetProfitReached) {
        const { boughtValue, boughtAmount } = await this.api.buy(valueToBuy, assetsToBuy);
        await markBought(currencyPair, boughtValue, boughtAmount);
      } else if (bidHasDropped) {
        await markBuying(currencyPair, currentBid, assetsToBuy);
      }
    } else if (targetProfitReached) {
      await markBuying(currencyPair, currentBid, assetsToBuy);
    }

    return true;
  }
}

module.exports = BuyService;
