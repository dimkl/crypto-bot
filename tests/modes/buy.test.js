const DB = require('../../src/db');
const buyMode = require('../../src/modes/buy');

const currencyPair = 'xlmeur';
const config = {
  changePercentage: '0.1000',
  comebackPercentage: '0.0200',
  tradePercentage: '1.0000',
};

describe("buy mode", () => {
  beforeAll(() => {
    console.log = jest.fn();
  });

  test("buy: when value dropping, updates buying state with min value until comeback decrease from latest value", async () => {
    DB[currencyPair] = DB[currencyPair] || {};
    Object.assign(DB[currencyPair], { capital: 50, assets: 0 });

    const data = [
      { currentBid: 114, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 106, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 102, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 98, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 99, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 100, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 95, hourlyOpen: 120, hourlyBid: 120 },
      { currentBid: 94, hourlyOpen: 120, hourlyBid: 120 }
    ];

    const state = { buying: null, bought: null };
    for (const dt of data) {
      Object.assign(DB[currencyPair], dt);
      await buyMode(currencyPair, config, state);

      // end buying
      if (state.bought) DB[currencyPair].capital = 0;
    }

    expect(state.buying).toBeNull();
    expect(state.bought).toBe(100);
  });
});

