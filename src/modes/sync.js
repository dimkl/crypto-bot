const { appendFile } = require('fs');
const models = require('../models');
const { SellService, BuyService } = require('../services');
const { Balance, Transaction, Price } = models;

async function syncPrices(currencyPair, api) {
  const [
    liveValues,
    hourlyValues,
  ] = await Promise.all([
    api.getLiveValues(),
    api.getHourlyValues()
  ]);
  Price
    .find({ currencyPair })
    .assign(liveValues)
    .assign(hourlyValues)
    .write();

  return { liveValues, hourlyValues };
}

async function syncBalance(currencyPair, api) {
  const accountBalance = await api.getAccountBalance();
  Balance
    .find({ currencyPair })
    .assign(accountBalance)
    .write();

  return accountBalance;
}

async function syncBuyTransaction(currencyPair, api) {
  const buyTransaction = await api.getUserLastBuyTransaction();

  Transaction
    .find({ currencyPair })
    .assign({ type: 'buy', ...buyTransaction })
    .write();

  return buyTransaction
}

async function sync(config, api) {
  const { currencyPair } = config;

  const [{ liveValues, hourlyValues }] = await Promise.all([
    syncPrices(currencyPair, api),
    syncBalance(currencyPair, api).catch(console.error),
    syncBuyTransaction(currencyPair, api).catch(console.error)
  ]);

  await new Promise((resolve, reject) => {
    const data = JSON.stringify({ ...liveValues, ...hourlyValues, createdAt: Date.now() });
    appendFile(`${currencyPair}.jsonl`, data + ',\n', (err) => err ? reject(err) : resolve());
  });
}

module.exports = (config, api) => {
  const { interval, currencyPair } = config;

  if (!interval) {
    console.log(`add configuration for ${currencyPair} in db.json`)
    return;
  }

  const sellService = new SellService({ currencyPair, ...config.sellMode }, api);
  const buyService = new BuyService({ currencyPair, ...config.buyMode }, api);

  setInterval(() => {
    console.log(currencyPair, ' syncing: ', new Date())
    sync(config, api).then(() => {
      return Promise.all([
        sellService.process(),
        buyService.process()
      ]);
    }).catch(console.error);
  }, interval);
};
