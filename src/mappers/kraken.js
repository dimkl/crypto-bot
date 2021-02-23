const {
  getExchangeRateKey,
  getTransactionType,
  getExchangeType,
} = require('./helpers');
const { makePercentage, splitCurrencies } = require('../helpers');


class KrakenMapper {
  constructor(options) {
    const { currencyPair } = options;
    this.currencyPair = currencyPair;
  }

  liveValues(data) {
    /*
      a = ask array(<price>, <whole lot volume>, <lot volume>),
      b = bid array(<price>, <whole lot volume>, <lot volume>),
      c = last trade closed array(<price>, <lot volume>),
      v = volume array(<today>, <last 24 hours>),
      p = volume weighted average price array(<today>, <last 24 hours>),
      t = number of trades array(<today>, <last 24 hours>),
      l = low array(<today>, <last 24 hours>),
      h = high array(<today>, <last 24 hours>),
      o = today's opening price
    */
    const { o: [open, last24hOpen], b: [bid], a: [ask], p: [vwap] } = data;
    return { open, currentBid: bid, currentAsk: ask, vwap };
  }

  hourlyValues(data) {
    const { open, bid, ask, vwap } = data;
    return { hourlyBid: bid, hourlyAsk: ask, hourlyOpen: open, hourlyVwap: vwap };
  }

  accountBalance(data) {
    /*
      eb = equivalent balance (combined balance of all currencies)
      tb = trade balance (combined balance of all equity currencies)
      m = margin amount of open positions
      n = unrealized net profit/loss of open positions
      c = cost basis of open positions
      v = current floating valuation of open positions
      e = equity = trade balance + unrealized net profit/loss
      mf = free margin = equity - initial margin (maximum margin available to open new positions)
      ml = margin level = (equity / initial margin) * 100
    */
    const [assetKey, capitalKey] = splitCurrencies(this.currencyPair);

    return {
      assets: data['X' + assetKey],
      capital: data['Z' + capitalKey],
      feePercentage: makePercentage(0)
    };
  }

  sell(data) {
    // TODO: implement
    const { id: orderId, datetime, price, amount } = data;
    return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
  }

  buy(data) {
    // TODO: implement
    const { id: orderId, datetime, price, amount } = data;
    return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
  }

  userTransactions(data) {
    // TODO: implement
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


module.exports = KrakenMapper;