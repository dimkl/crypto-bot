const { Balance, Price, Transaction } = require('../models');
const db = require('../storage');
const {
  getAccountBalance,
  getCurrentValues,
  getHourlyValues,
  getUserLastBuyTransaction
} = require('../adapters/bitstamp');
const { appendFile } = require('fs');

const initialized = {};

function initializeCurrencyPairs(currencyPair) {
  const collections = ['transactions', 'prices', 'balance', 'config'];
  collections.forEach((collection) => {
    const exists = db.get(collection).find({ currencyPair }).value();

    if (!exists) {
      db.get(collection)
        .push({ currencyPair })
        .write();
    }
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
    const data = JSON.stringify({ currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen });
    appendFile(`${currencyPair}.jsonl`, data + '\n', (err) => err ? reject(err) : resolve());
  });
}

module.exports = setup;
