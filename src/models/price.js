const db = require('../storage');

const Price = db.defaults({
  prices: [
    { currencyPair: 'xlmeur', currentAsk: '', hourlyAsk: '', currentBid: '', hourlyBid: '', open: '', hourlyOpen: '' },
    { currencyPair: 'xrpeur', currentAsk: '', hourlyAsk: '', currentBid: '', hourlyBid: '', open: '', hourlyOpen: '' },
  ]
}).get('prices');

module.exports = Price;