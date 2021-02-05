const { Balance, Price, Transaction } = require('../../src/models');
const sellMode = require('../../src/modes/sell');

const currencyPair = 'xlmeur';
const config = {
  changePercentage: '0.1000',
  comebackPercentage: '0.0200',
  tradePercentage: '1.0000'
};

describe("sell mode", () => {
  beforeAll(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    Transaction.remove({ currencyPair }).write();
    console.log = jest.fn();
  });

  test("sell: when value rising, updates selling state with max value until comeback decrease from latest value", async () => {
    Balance.push({ currencyPair, capital: 0, assets: 50 }).write();
    Price.push({ currencyPair }).write();
    Transaction.push({ currencyPair, type: 'buy', assets: 50, exchangeRate: 100 }).write();

    const data = [
      { currentAsk: 98, hourlyAsk: 100 },
      { currentAsk: 108, hourlyAsk: 100 },
      { currentAsk: 110, hourlyAsk: 100 },
      { currentAsk: 114, hourlyAsk: 100 },
      { currentAsk: 118, hourlyAsk: 100 },
      { currentAsk: 109, hourlyAsk: 100 },
      { currentAsk: 120, hourlyAsk: 100 },
      { currentAsk: 95, hourlyAsk: 100 },
    ];

    const state = { selling: null };
    for (const dt of data) {
      Price.find({ currencyPair }).assign(dt).write();
      await sellMode(currencyPair, config, state);

      // end selling
      if (state.sold) Balance.find({ currencyPair }).assign({ assets: 0 }).write();
    }

    expect(state.selling).toBeNull();
    expect(state.sold).toBe(109);
  });
});
