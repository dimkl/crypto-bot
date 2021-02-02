const DB = require('../../src/db');
const sellMode = require('../../src/modes/sell');

const currencyPair = 'xlmeur';
const config = {
  changePercentage: '0.1000',
  comebackPercentage: '0.0200',
  tradePercentage: '1.0000'
};

describe("sell mode", () => {
  beforeAll(() => {
    console.log = jest.fn();
  });

  test("sell: when value rising, updates selling state with max value until comeback decrease from latest value", async () => {
    DB[currencyPair] = DB[currencyPair] || {};
    Object.assign(DB[currencyPair], { capital: 0, assets: 50 });

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

    const state = { selling: null, bought: 100 };
    for (const dt of data) {
      Object.assign(DB[currencyPair], dt);
      await sellMode(currencyPair, config, state);

      // end selling
      if (state.sold) DB[currencyPair].assets = 0;
    }

    expect(state.selling).toBeNull();
    expect(state.sold).toBe(109);
  });
});
