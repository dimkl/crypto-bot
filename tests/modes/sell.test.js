const DB = require('../../src/db');
const sellMode = require('../../src/modes/sell');
const config = {
  sellMode: {
    changePercentage: '0.1000',
    comebackPercentage: '0.0200',
    tradePercentage: '1.0000'
  },
  currencyPair: 'xlmeur'
};

describe("sell mode", () => {
  beforeAll(() => {
    console.log = jest.fn();
  });

  test("sell: when value rising, updates selling state with max value until comeback decrease from latest value", async () => {
    DB[config.currencyPair] = DB[config.currencyPair] || {};
    Object.assign(DB[config.currencyPair], { capital: 0, assets: 50 });
    Object.assign(DB[config.currencyPair].state, { selling: null, bought: 100 });

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

    for (const dt of data) {
      Object.assign(DB[config.currencyPair], dt);
      await sellMode(config);

      // end selling
      if (DB[config.currencyPair].state.sold) DB[config.currencyPair].assets = 0;
    }

    expect(DB[config.currencyPair].state.selling).toBeNull();
    expect(DB[config.currencyPair].state.sold).toBe(109);
  });
});
