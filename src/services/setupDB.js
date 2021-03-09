const models = require('../models');
const { State, Transaction } = models;

class SetupDBService {
  constructor() {
    this.initialized = {};
  }

  stateExists(currencyPair, mode) {
    return !!State.find({ currencyPair, mode }).value();
  }

  createState(currencyPair, mode) {
    State.push({ currencyPair, mode, createdAt: new Date() }).write();
  }

  transactionExists(currencyPair, mode) {
    return !!Transaction.find({ currencyPair, mode }).value();
  }

  createTransaction(currencyPair, mode) {
    Transaction.push({ currencyPair, mode, createdAt: new Date() }).write();
  }

  setupModel(Model, currencyPair) {
    const exists = Model.find({ currencyPair }).value();
    if (!exists) {
      Model.push({ currencyPair }).write();
    }
  }

  process(currencyPair) {
    if (this.initialized[currencyPair]) return;

    Object.values(models).forEach(Model => {
      this.setupModel(Model, currencyPair)
    });

    // state & transaction model setup
    ['buy', 'sell'].forEach(mode => {
      if (!this.stateExists(currencyPair, mode)) {
        this.createState(currencyPair, mode);
      }
      if (!this.transactionExists(currencyPair, mode)) {
        this.createTransaction(currencyPair, mode);
      }
    });

    this.initialized[currencyPair] = true;
  }
}

module.exports = SetupDBService;