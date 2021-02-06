const { Balance, Price, State, AuditLog } = require('../models');
const { hasDecreasedFor, hasIncreasedFor } = require('../helpers');
const { buy } = require('../adapters/bitstamp');

function markBuying(currencyPair, value, amount) {
  console.log('mark buying: ', { currencyPair, value, now: new Date(), amount });
  State.find({ currencyPair, mode: 'buy' })
    .assign({ current: value, final: null, amount, updatedAt: new Date() })
    .write();
}

function markBought(currencyPair, value, amount) {
  State.find({ currencyPair, mode: 'buy' })
    .assign({ current: null, final: value, amount, updatedAt: new Date() })
    .write();
  AuditLog
    .push({ mode: 'buy', currencyPair, value, amount, createdAt: new Date() })
    .write();
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
  const initial = buying ? buying : hourlyOpen;
  const bidHasDropped = currentBid < buying;
  const assetsToBuy = (tradePercentage * (parseFloat(currentBid) * parseFloat(capital))).toFixed(4);

  if (hasDecreasedFor(currentBid, initial, percent)) {
    await markBuying(currencyPair, currentBid, assetsToBuy);
  } else if (buying && hasIncreasedFor(currentBid, buying, comebackPercentage)) {
    const { boughtValue, boughtAmount } = await buy(currentBid, assetsToBuy, currencyPair);

    await markBought(currencyPair, boughtValue, boughtAmount);
  } else if (bidHasDropped) {
    await markBuying(currencyPair, currentBid, assetsToBuy);
  }
}


module.exports = buyMode;
