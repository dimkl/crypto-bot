const { State, AuditLog } = require('../models');

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

function markSelling(currencyPair, value, amount) {
  console.log('mark selling: ', { currencyPair, value, now: new Date(), amount });
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: value, final: null, amount, updatedAt: new Date() })
    .write();
}

function markSold(currencyPair, value, amount) {
  State.find({ currencyPair, mode: 'sell' })
    .assign({ current: null, final: value, amount, updatedAt: new Date() })
    .write();
  AuditLog
    .push({ mode: 'sell', currencyPair, value, amount, createdAt: new Date() })
    .write();
}

function improveSellOffer(value, assets) {
  return {
    value: (value * 0.999).toFixed(5),
    assets: (assets * 0.999).toFixed(4)
  };
}

function hasEnoughToTrade(value, assets) {
  return (value * assets) >= 25;
}

function improveBuyOffer(value, assets) {
  return {
    value: (value * 1.001).toFixed(5),
    assets: (assets * 0.999).toFixed(4)
  };
}

function hasEnoughToBuy(value) {
  return value >= 25;
}

module.exports = {
  markSelling,
  markSold,
  markBuying,
  markBought,
  improveSellOffer,
  hasEnoughToTrade,
  improveBuyOffer,
  hasEnoughToBuy
};