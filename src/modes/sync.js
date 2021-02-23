const models = require('../models');
const { appendFile } = require('fs');
const { Balance, State, Transaction, Price } = models;

const initialized = {};

function stateExists(currencyPair, mode) {
  return !!State.find({ currencyPair, mode }).value();
}

function createState(currencyPair, mode) {
  State.push({ currencyPair, mode, createdAt: new Date() }).write();
}

function setupModel(Model, currencyPair) {
  const exists = Model.find({ currencyPair }).value();
  if (!exists) {
    Model.push({ currencyPair }).write();
  }
}

function initializeCurrencyPairs(currencyPair) {
  Object.values(models).forEach(Model => setupModel(Model, currencyPair));

  // state model setup
  ['buy', 'sell'].forEach(mode => {
    if (!stateExists(currencyPair, mode)) {
      createState(currencyPair, mode);
    }
  });

  initialized[currencyPair] = true;
}

async function sync(config, api) {
  const { currencyPair } = config;

  const [
    { currentBid, currentAsk, open, vwap },
    { hourlyBid, hourlyAsk, hourlyOpen, hourlyVwap },
    { assets, capital, feePercentage },
    { assets: lastBoughtAssets, exchangeRate: lastBoughtBid } = {}
  ] = await Promise.all([
    api.getLiveValues(),
    api.getHourlyValues(),
    api.getAccountBalance(),
    api.getUserLastBuyTransaction()
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

module.exports = sync;
