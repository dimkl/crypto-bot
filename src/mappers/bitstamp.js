const {
  getAvailableKeys,
  getFeeKey,
  getExchangeRateKey,
  getTransactionType,
  getExchangeType,
} = require('./helpers');
const { makePercentage, splitCurrencies } = require('../helpers');

class BitstampMapper {
  constructor(options) {
    const { currencyPair } = options;
    this.currencyPair = currencyPair;
  }

  liveValues(data) {
    const { open, bid, ask, vwap } = data;
    return { open, currentBid: bid, currentAsk: ask, vwap };
  }

  hourlyValues(data) {
    const { open, bid, ask, vwap } = data;
    return { hourlyBid: bid, hourlyAsk: ask, hourlyOpen: open, hourlyVwap: vwap };
  }

  accountBalance(data) {
    const [assetKey, capitalKey] = getAvailableKeys(this.currencyPair);
    const feeKey = getFeeKey(this.currencyPair);

    return {
      assets: data[assetKey],
      capital: data[capitalKey],
      feePercentage: makePercentage(data[feeKey])
    };
  }

  sell(data) {
    const { id: orderId, datetime, price, amount } = data;
    return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
  }

  buy(data) {
    const { id: orderId, datetime, price, amount } = data;
    return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
  }

  userTransactions(data) {
    const [assetsKey, capitalKey] = splitCurrencies(this.currencyPair);

    return data
      .filter(t => t[getExchangeRateKey(this.currencyPair)])
      .map(t => ({
        transactionId: t.id,
        orderId: t.order_id,
        transactionType: getTransactionType(t.type),
        capital: Math.abs(t[capitalKey]),
        assets: Math.abs(t[assetsKey]),
        feeAmount: t.fee,
        datetime: t.datetime,
        exchangeRate: t[getExchangeRateKey(this.currencyPair)],
        exchangeType: getExchangeType(t[capitalKey])
      }));
  }
}


module.exports = BitstampMapper;