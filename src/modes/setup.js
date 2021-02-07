const { Balance, Price, Transaction, State } = require('../models');
const db = require('../storage');
const {
  getAccountBalance,
  getCurrentValues,
  getHourlyValues,
  getUserLastBuyTransaction
} = require('../adapters/bitstamp');
const { appendFile } = require('fs');

const initialized = {};

function stateExists(currencyPair, mode) {
  return !!State.find({ currencyPair, mode }).value();
}

function stateCreate(currencyPair, mode) {
  State.push({ currencyPair, mode, createdAt: new Date() }).write();
}

function initializeCurrencyPairs(currencyPair) {
  const collections = ['transactions', 'prices', 'balance', 'config', 'state'];
  collections.forEach((collection) => {
    const exists = db.get(collection).find({ currencyPair }).value();

    if (!exists) {
      db.get(collection)
        .push({ currencyPair })
        .write();
    }
  });

  // state model setup
  ['buy', 'sell'].forEach(mode => {
    if (!stateExists(currencyPair, mode)) stateCreate(currencyPair, mode);
  });

  initialized[currencyPair] = true;
}

async function setup(currencyPair) {
  const [
    { assets, capital, feePercentage },
    { currentBid, currentAsk, open, vwap },
    { hourlyBid, hourlyAsk, hourlyOpen, hourlyVwap },
    { assets: lastBoughtAssets, exchangeRate: lastBoughtBid } = {}
  ] = await Promise.all([
    getAccountBalance(currencyPair),
    getCurrentValues(currencyPair),
    getHourlyValues(currencyPair),
    getUserLastBuyTransaction(currencyPair)
  ]);

  if (!initialized[currencyPair]) initializeCurrencyPairs(currencyPair);

  Balance
    .find({ currencyPair })
    .assign({ capital, assets, feePercentage })
    .write();
  Price
    .find({ currencyPair })
    .assign({ currentBid, currentAsk, open, vwap })
    .assign({ hourlyBid, hourlyAsk, hourlyOpen, hourlyVwap })
    .write();
  Transaction
    .find({ currencyPair })
    .assign({ type: 'buy', assets: lastBoughtAssets, exchangeRate: lastBoughtBid })
    .write();

  await new Promise((resolve, reject) => {
    const data = JSON.stringify({ currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen, createdAt: Date.now() });
    appendFile(`${currencyPair}.jsonl`, data + ',\n', (err) => err ? reject(err) : resolve());
  });
}

module.exports = setup;
