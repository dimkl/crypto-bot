const { makePercentage, splitCurrencies } = require('../helpers');

class BitstampMapper {
  constructor(options) {
    const { currencyPair } = options;
    this.currencyPair = currencyPair;
  }

  get availableKeys() {
    return splitCurrencies(this.currencyPair).map(s => `${s}_available`);
  }

  get feeKey() {
    return `${this.currencyPair}_fee`;
  }

  get exchangeRateKey() {
    return splitCurrencies(this.currencyPair).join('_');
  }

  _getTransactionType(type) {
    const mapping = { 0: 'deposit', 1: 'withdrawl', 2: 'market_trade', 14: 'sub_account_transfer' };
    return mapping[type];
  }

  _getExchangeType(capital) {
    return capital > 0 ? 'sell' : 'buy';
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
    const [assetKey, capitalKey] = this.availableKeys;
    const feeKey = this.feeKey;

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
      .filter(t => t[this.exchangeRateKey])
      .map(t => ({
        transactionId: t.id,
        orderId: t.order_id,
        transactionType: this._getTransactionType(t.type),
        capital: Math.abs(t[capitalKey]),
        assets: Math.abs(t[assetsKey]),
        feeAmount: t.fee,
        datetime: t.datetime,
        exchangeRate: t[this.exchangeRateKey],
        exchangeType: this._getExchangeType(t[capitalKey])
      }));
  }
}


module.exports = BitstampMapper;