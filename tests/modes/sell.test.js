const { Balance, Price, Transaction, State, AuditLog } = require('../../src/models');
const sellMode = require('../../src/modes/sell');

const currencyPair = 'xlmeur';


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

    const config = {
      changePercentage: '0.1000',
      comebackPercentage: '0.0200',
      tradePercentage: '1.0000',
      apiKey: 'deadbeefKey',
      apiSecret: 'deadbeefSecret',
    };

    const data = [
      { currentAsk: 98, hourlyOpen: 100 },
      { currentAsk: 108, hourlyOpen: 100 },
      { currentAsk: 110, hourlyOpen: 100 },
      { currentAsk: 114, hourlyOpen: 100 },
      { currentAsk: 118, hourlyOpen: 100 },
      { currentAsk: 109, hourlyOpen: 100 },
      { currentAsk: 120, hourlyOpen: 100 },
      { currentAsk: 95, hourlyOpen: 100 },
    ];

    for (const dt of data) {
      Price.find({ currencyPair }).assign(dt).write();
      await sellMode({ currencyPair, ...config });

      // end selling
      if (getState().final) Balance.find({ currencyPair }).assign({ assets: 0 }).write();
    }

    const state = getState();
    expect(state.final).toBe("108.89100");
    expect(state.current).toBeNull();
    const auditLog = AuditLog.find({ currencyPair, mode: 'sell' }).value();
    expect(auditLog).toMatchObject({
      createdAt: expect.anything(),
      amount: "49.9500",
      currencyPair: "xlmeur",
      mode: "sell",
      value: "108.89100"
    });
  });
});
