const get = require('lodash.get');
const { makePercentage, splitCurrencies, convertCurrencyToISO4217 } = require('../helpers');


class KrakenMapper {
  constructor(options) {
    const { currencyPair } = options;
    this.currencyPair = convertCurrencyToISO4217(currencyPair);
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
    /*
    channelID	integer	ChannelID of pair-ohlc subscription
    Array	
      time	decimal	Begin time of interval, in seconds since epoch
      etime	decimal	End time of interval, in seconds since epoch
      open	decimal	Open price of interval
      high	decimal	High price within interval
      low	decimal	Low price within interval
      close	decimal	Close price of interval
      vwap	decimal	Volume weighted average price within interval
      volume	integer	Accumulated volume within interval
      count	integer	Number of trades within interval
    channelName	string	Channel Name of subscription
    pair	string	Asset pair
    */
    const [_time, _etime, open, _high, _low, _close, vwap] = data;
    return { hourlyBid: '', hourlyAsk: '', hourlyOpen: open, hourlyVwap: vwap };
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
    const orderId = data.txid.join('');

    const orderInfo = get(data, 'descr.order', '');
    const soldValue = (orderInfo.match(/\@ limit ([\.\d]+)/) || [])[1];
    const soldAmount = (orderInfo.match(/^sell ([\.\d]+) /) || [])[1];

    return { orderId, soldValue, soldAmount, soldAt: Date.now() };
  }

  buy(data) {
    const orderId = data.txid.join('');

    const orderInfo = get(data, 'descr.order', '');
    const boughtValue = (orderInfo.match(/\@ limit ([\.\d]+)/) || [])[1];
    const boughtAmount = (orderInfo.match(/^buy ([\.\d]+) /) || [])[1];

    return { orderId, boughtValue, boughtAmount, boughtAt: Date.now() };
  }

  userTransactions(data) {
    // TODO: implement
    return data
      // .filter(t => t[getExchangeRateKey(this.currencyPair)])
      .map(t => ({
        transactionId: '',
        orderId: '',
        transactionType: '',
        capital: '',
        assets: '',
        feeAmount: '',
        datetime: '',
        exchangeRate: '',
        exchangeType: ''
      }));
  }
}


module.exports = KrakenMapper;