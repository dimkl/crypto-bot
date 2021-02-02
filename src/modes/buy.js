const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');

function markBuying(state, value) {
  // console.log('mark buying: ', { value,  now: new Date() });
  Object.assign(state, { buying: value });
}

function markBought(state, { boughtValue, boughtAt, boughtAmount }) {
  console.log('mark bought: ', { boughtValue, boughtAt, boughtAmount });
  Object.assign(state, { bought: boughtValue, created_at: boughtAt, amount: boughtAmount, buying: null });
}

async function buyMode(currencyPair, config, state) {
  const { changePercentage, comebackPercentage, tradePercentage } = config.buyMode;
  const { currentBid, hourlyOpen, hourlyBid, capital, feePercentage = 0.0 } = DB[currencyPair];
  const { buying } = state;

  const isValueDropping = currentBid <= hourlyBid;
  const targetWithFee = (parseFloat(changePercentage) + parseFloat(feePercentage)).toFixed(4);
  const hasCapital = capital > 0;

  if (!isValueDropping) {
    return;
  }
  if (!hasCapital) {
    console.log('Not enough capital!');
    return;
  }

  const percent = buying ? comebackPercentage : targetWithFee;
  const initial = buying ? buying : hourlyOpen;
  const bidHasDropped = currentBid < buying;

  if (hasDecreasedFor(currentBid, initial, percent)) {
    await markBuying(state, currentBid);
  } else if (buying && hasIncreasedFor(currentBid, buying, comebackPercentage)) {
    const assetsToBuy = (tradePercentage * (parseFloat(currentBid) / parseFloat(capital))).toFixed(4);
    const boughtParams = await buy(currentBid, assetsToBuy, currencyPair);
    await markBought(state, boughtParams);
  } else if (bidHasDropped) {
    await markBuying(state, currentBid);
  }
}


module.exports = buyMode;
