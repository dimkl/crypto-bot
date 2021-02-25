const models = require('../models');
const { SellService, BuyService, SetupDBService } = require('../services');
const { Balance, Transaction, Price } = models;

const setupDBService = new SetupDBService();

async function syncPrices(currencyPair, liveValues, hourlyValues) {
  Price
    .find({ currencyPair })
    .assign({ ...liveValues, ...hourlyValues })
    .write();
}

async function syncBalance(currencyPair, accountBalance) {
  Balance
    .find({ currencyPair })
    .assign(accountBalance)
    .write();
}

async function syncBuyTransaction(currencyPair, buyTransaction) {
  Transaction
    .find({ currencyPair })
    .assign({ type: 'buy', ...buyTransaction })
    .write();
}

async function sync(config, api) {
  const { currencyPair } = config;

  const sellService = new SellService({ currencyPair, ...config.sellMode }, api);
  const buyService = new BuyService({ currencyPair, ...config.buyMode }, api);

  await setupDBService.process(currencyPair);

  api.getLiveValues(syncPrices.bind(null, currencyPair));
  api.getHourlyValues(syncPrices.bind(null, currencyPair, null));
  // api.getAccountBalance(syncBalance.bind(null, currencyPair));
  // api.getUserLastBuyTransaction(syncBuyTransaction(null, currencyPair));

  api.getLiveValues(async (_) => {
    console.log(currencyPair, 'syncing socket:', new Date());

    try {
      await Promise.all([
        sellService.process(),
        buyService.process()
      ]);
    } catch (err) {
      console.error(err);
    }
  });

  await api.initialized();
  await api.finished();
}

module.exports = sync;
