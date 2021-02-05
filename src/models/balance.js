const { makePercentage } = require('../helpers');

const db = require('../storage');

const Balance = db.defaults({
  balance: [
    {
      currencyPair: 'xlmeur',
      capital: 0,
      assets: 0,
      feePercentage: makePercentage(0.5)
    },
    {
      currencyPair: 'xrpeur',
      capital: 0,
      assets: 0,
      feePercentage: makePercentage(0.5),
    }
  ]
}).get('balance');

module.exports = Balance;