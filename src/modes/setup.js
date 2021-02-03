const DB = require('../db');
const {
  getAccountBalance,
  getCurrentValues,
  getHourlyValues,
  getUserLastBuyTransaction
} = require('../adapters/bitstamp');
const { appendFile } = require('fs');

async function setup(currencyPair) {
  const [
    { assets, capital, feePercentage },
    { currentBid, currentAsk, open, vwap },
    { hourlyBid, hourlyAsk, hourlyOpen, hourlyVwap },
    { assets: boughtAssets, exchangeRate }
  ] = await Promise.all([
    getAccountBalance(currencyPair),
    getCurrentValues(currencyPair),
    getHourlyValues(currencyPair),
    getUserLastBuyTransaction(currencyPair)
  ]);

  DB[currencyPair] = DB[currencyPair] || {};
  Object.assign(DB[currencyPair], { capital, assets, feePercentage, currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen });

  await new Promise((resolve, reject) => {
    const data = JSON.stringify({ currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen });
    appendFile(`${currencyPair}.jsonl`, data + '\n', (err) => err ? reject(err) : resolve());
  });
}

module.exports = setup;
