const { Balance, Price } = require('../../src/models');
const buyMode = require('../../src/modes/buy');

const currencyPair = 'xlmeur';
const config = {
  changePercentage: '0.1000',
  comebackPercentage: '0.0200',
  tradePercentage: '1.0000',
};

describe("buy mode", () => {
  beforeAll(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    console.log = jest.fn();
  });

  test("buy: when value dropping, updates buying state with min value until comeback decrease from latest value", async () => {
    Balance.push({ currencyPair, capital: 50, assets: 0 }).write();
    Price.push({ currencyPair }).write();

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
      Price.find({ currencyPair }).assign(dt).write();
      await buyMode(currencyPair, config, state);

      // end buying
      if (state.bought) Balance.find({ currencyPair }).assign({ capital: 0 }).write();
    }

    expect(state.buying).toBeNull();
    expect(state.bought).toBe(100);
  });
});

