const models = require('../models');
const { SellService, BuyService, SetupDBService } = require('../services');
const { Balance, Transaction, Price } = models;

const setupDBService = new SetupDBService();

async function syncPrices(currencyPair, liveValues, hourlyValues) {
  Price
    .find({ currencyPair })
    .assign(liveValues)
    .assign(hourlyValues)
    .assign({ updatedAt: new Date() })
    .write();
}

async function syncBalance(currencyPair, accountBalance) {
  Balance
    .find({ currencyPair })
    .assign(accountBalance)
    .write();
}

async function syncBuyTransaction(currencyPair, buyTransactions) {
  const lastBuyTrx = buyTransactions.filter(t => t.exchangeType == 'buy').shift();
  Transaction
    .find({ currencyPair })
    .assign({ type: 'buy', ...lastBuyTrx })
    .write();
}

async function sync(config, api) {
  const { currencyPair } = config;

  const sellService = new SellService({ currencyPair, ...config.sellMode }, api);
  const buyService = new BuyService({ currencyPair, ...config.buyMode }, api);

  await setupDBService.process(currencyPair);

  await api.getLiveValues(syncPrices.bind(null, currencyPair));
  await api.getHourlyValues(syncPrices.bind(null, currencyPair, null));
  await api.getAccountBalance(syncBalance.bind(null, currencyPair));
  await api.getUserTransactions(syncBuyTransaction.bind(null, currencyPair));

  await api.getLiveValues(async (_) => {
    try {
      await Promise.all([
        sellService.process(),
        buyService.process()
      ]);
    } catch (err) {
      console.error(err);
    }
  });

  await api.initialize();
}

module.exports = sync;
