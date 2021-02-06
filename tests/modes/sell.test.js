const { Balance, Price, Transaction, State, AuditLog } = require('../../src/models');
const sellMode = require('../../src/modes/sell');

const currencyPair = 'xlmeur';
const config = {
  changePercentage: '0.1000',
  comebackPercentage: '0.0200',
  tradePercentage: '1.0000'
};

function getState() {
  return State.find({ currencyPair, mode: 'sell' }).value();
}

describe("sell mode", () => {
  beforeAll(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    Transaction.remove({ currencyPair }).write();
    State.remove({ currencyPair }).write();
    AuditLog.remove({ currencyPair, mode: 'sell' }).write();

    console.log = jest.fn();
  });

  test("sell: when value rising, updates selling state with max value until comeback decrease from latest value", async () => {
    Balance.push({ currencyPair, capital: 0, assets: 50 }).write();
    Price.push({ currencyPair }).write();
    Transaction.push({ currencyPair, type: 'buy', assets: 50, exchangeRate: 100 }).write();
    State.push({ currencyPair, mode: 'sell' }).write();

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
      Price.find({ currencyPair }).assign(dt).write();
      await sellMode(currencyPair, config);

      // end selling
      if (getState().final) Balance.find({ currencyPair }).assign({ assets: 0 }).write();
    }

    const state = getState();
    expect(state.final).toBe(109);
    expect(state.current).toBeNull();
    const auditLog = AuditLog.find({ currencyPair, mode: 'sell' }).value();
    expect(auditLog).toMatchObject({
      createdAt: expect.anything(),
      amount: "50.0000",
      currencyPair: "xlmeur",
      mode: "sell",
      value: 109
    });
  });
});
