const { makeModeConfig, intervalSeconds, makePercentage } = require('./helpers');

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync(`./db.${process.env.NODE_ENV || ''}.json`)
const db = low(adapter)

db.defaults({
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
  ],
  config: [
    {
      currencyPair: 'xlmeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(50, 2, 0.5),
      sellMode: makeModeConfig(50, 2, 0.5),
    },
    {
      currencyPair: 'xrpeur',
      interval: intervalSeconds(5),
      buyMode: makeModeConfig(50, 2, 0.5),
      sellMode: makeModeConfig(50, 2, 0.5),
    }
  ],
  prices: [
    { currencyPair: 'xlmeur', currentAsk: '', hourlyAsk: '', currentBid: '', hourlyBid: '', open: '', hourlyOpen: '' },
    { currencyPair: 'xrpeur', currentAsk: '', hourlyAsk: '', currentBid: '', hourlyBid: '', open: '', hourlyOpen: '' },
  ]
}).write();

module.exports = db;