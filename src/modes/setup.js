const DB = require('../db');
const { getAccountBalance, getCurrentValues, getHourlyValues } = require('../adapters/bitstamp');
const { appendFile} = require('fs');

async function setup(currencyPair) {
  const [
    { assets, capital, feePercentage },
    { currentBid, currentAsk, open, vwap },
    { hourlyBid, hourlyAsk, hourlyOpen, hourlyVwap }
  ] = await Promise.all([
    getAccountBalance(),
    getCurrentValues(currencyPair),
    getHourlyValues(currencyPair)
  ]);
  // Object.assign(DB, { assets, capital, currentBid, currentAsk, open, hourlyBid, hourlyAsk });
  // temporarily ignore capital and assets from account balance
  DB[currencyPair] = DB[currencyPair] || {};
  Object.assign(DB[currencyPair], { currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen });
  if (DB[currencyPair].assets == null || DB[currencyPair].capital == null) {
    const config = require('../config');
    Object.assign(DB[currencyPair], { assets: config.assets, capital: config.capital, feePercentage: config.feePercentage });
  }
  
 await new Promise((resolve, reject)=>{
    const data = JSON.stringify({currentBid, currentAsk, open, hourlyBid, hourlyAsk, hourlyOpen});
    appendFile(`${currencyPair}.jsonl`, data, (err) => err ? reject(err) : resolve());
 });
}

module.exports = setup;
