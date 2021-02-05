const { Balance, Price } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');

function markBuying(currencyPair, state, value) {
  console.log('mark buying: ', { currencyPair, value, now: new Date() });
  Object.assign(state, { buying: value });
}

function markBought(currencyPair, state, { boughtValue, boughtAt, boughtAmount }) {
  console.log('mark bought: ', { currencyPair, now: new Date(), boughtValue, boughtAt, boughtAmount });
  Object.assign(state, { bought: boughtValue, created_at: boughtAt, amount: boughtAmount, buying: null });
}

async function buyMode(currencyPair, config, state) {
  const { changePercentage, comebackPercentage, tradePercentage } = config;
  const { currentBid, hourlyOpen, hourlyBid } = Price.find({ currencyPair }).value();
  const { capital, feePercentage = 0.0 } = Balance.find({ currencyPair }).value();
  const { buying } = state;

  const isValueDropping = currentBid <= hourlyBid;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasCapital = capital > 0;

  if (!isValueDropping || !hasCapital) {
    return;
  }

  const percent = buying ? comebackPercentage : targetWithFee;
  const initial = buying ? buying : hourlyOpen;
  const bidHasDropped = currentBid < buying;

  if (hasDecreasedFor(currentBid, initial, percent)) {
    await markBuying(currencyPair, state, currentBid);
  } else if (buying && hasIncreasedFor(currentBid, buying, comebackPercentage)) {
    const assetsToBuy = (tradePercentage * (parseFloat(currentBid) / parseFloat(capital))).toFixed(4);
    const boughtParams = await buy(currentBid, assetsToBuy, currencyPair);
    await markBought(currencyPair, state, boughtParams);
  } else if (bidHasDropped) {
    await markBuying(currencyPair, state, currentBid);
  }
}


module.exports = buyMode;
