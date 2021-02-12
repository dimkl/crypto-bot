const { Balance, Price, State } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');
const { markBuying, markBought } = require('./helpers');

function improveBuyOffer(value, assets) {
  return {
    value: (value * 1.001).toFixed(5),
    assets: (assets * 0.999).toFixed(4)
  };
}

async function buyMode(currencyPair, config) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentBid, hourlyOpen } = Price.find({ currencyPair }).value();
  const { capital, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();
  const { current: buying } = State.find({ currencyPair, mode: 'buy' }).value();

  const isValueDropping = currentBid <= hourlyOpen;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasCapital = capital > 0;

  if (!isValueDropping || !hasCapital) {
    return;
  }

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
      const { boughtValue, boughtAmount } = await buy(valueToBuy, assetsToBuy, currencyPair);
      await markBought(currencyPair, boughtValue, boughtAmount);
    } else if (bidHasDropped) {
      await markBuying(currencyPair, currentBid, assetsToBuy);
    }
  } else if (targetProfitReached) {
    await markBuying(currencyPair, currentBid, assetsToBuy);
  }
}


module.exports = buyMode;
