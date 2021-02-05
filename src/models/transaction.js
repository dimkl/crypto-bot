const db = require('../storage');

const Transaction = db.defaults({
  transactions: [
    { type: 'buy', currencyPair: 'xlmeur', assets: '', capital: '', exchangeRate: '' },
    { type: 'buy', currencyPair: 'xrpeur', assets: '', capital: '', exchangeRate: '' },
    { type: 'sell', currencyPair: 'xlmeur', assets: '', capital: '', exchangeRate: '' },
    { type: 'sell', currencyPair: 'xrpeur', assets: '', capital: '', exchangeRate: '' },
  ]
}).get('transactions');

module.exports = Transaction;

