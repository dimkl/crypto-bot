const DB = require('../db');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');

function markBuying(value, currencyPair) {
  console.log('mark buying: ', { value, currencyPair, now: new Date() });
  Object.assign(DB[currencyPair].state, { buying: value });
}

function markBought(value, currencyPair) {
  console.log('mark bought: ', { value, currencyPair, now: new Date() });
  Object.assign(DB[currencyPair].state, { bought: value, buying: null });
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
    await markBuying(currentBid, currencyPair);
  } else if (buying && hasIncreasedFor(currentBid, buying, comebackPercentage)) {
    const { boughtValue } = await buy(currentBid, tradePercentage, currencyPair);
    await markBought(boughtValue, currencyPair);
  } else if (bidHasDropped) {
    await markBuying(currentBid, currencyPair);
  }
}


module.exports = buyMode;
