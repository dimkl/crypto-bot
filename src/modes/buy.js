const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');

function markBuying(currencyPair, value) {
  // console.log('mark buying: ', { value, currencyPair, now: new Date() });
  Object.assign(DB[currencyPair].state, { buying: value });
}

function markBought(currencyPair, { boughtValue, boughtAt, boughtAmount }) {
  console.log('mark bought: ', { boughtValue, currencyPair, boughtAt, boughtAmount });
  Object.assign(DB[currencyPair].state, { bought: boughtValue, created_at: boughtAt, amount: boughtAmount, buying: null });
}

async function buyMode(config) {
  const { changePercentage, comebackPercentage, tradePercentage } = config.buyMode;
  const { currencyPair } = config;
  const { currentBid, hourlyOpen, hourlyBid, capital, feePercentage = 0.0 } = DB[currencyPair];
  const { buying } = DB[currencyPair].state;

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
    await markBuying(currencyPair, currentBid);
  } else if (buying && hasIncreasedFor(currentBid, buying, comebackPercentage)) {
    const assetsToBuy = (tradePercentage * (parseFloat(currentBid) / parseFloat(capital))).toFixed(4);
    const boughtParams = await buy(currentBid, assetsToBuy, currencyPair);
    await markBought(currencyPair, boughtParams);
  } else if (bidHasDropped) {
    await markBuying(currencyPair, currentBid);
  }
}


module.exports = buyMode;
