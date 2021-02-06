const { Balance, Price, State, AuditLog } = require("../../src/models");
const buyMode = require("../../src/modes/buy");

const currencyPair = "xlmeur";
const config = {
  changePercentage: "0.1000",
  comebackPercentage: "0.0200",
  tradePercentage: "1.0000",
};

function getState() {
  return State.find({ currencyPair, mode: "buy" }).value();
}

describe("buy mode", () => {
  beforeAll(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    State.remove({ currencyPair }).write();
    AuditLog.remove({ currencyPair, mode: 'buy' }).write();

    console.log = jest.fn();
  });

  test("buy: when value dropping, updates buying state with min value until comeback decrease from latest value", async () => {
    Balance.push({ currencyPair, capital: 50, assets: 0 }).write();
    Price.push({ currencyPair }).write();
    State.push({ currencyPair, mode: "buy" }).write();

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

    for (const dt of data) {
      Price.find({ currencyPair }).assign(dt).write();
      await buyMode(currencyPair, config);

      // end buying
      if (getState().final) Balance.find({ currencyPair }).assign({ capital: 0 }).write();
    }

    const state = getState();
    expect(state.current).toBeNull();
    expect(state.final).toBe(100);
    const auditLog = AuditLog.find({ currencyPair, mode: "buy" }).value();
    expect(auditLog).toMatchObject({
      createdAt: expect.anything(),
      amount: "5000.0000",
      currencyPair: "xlmeur",
      mode: "buy",
      value: 100
    });
  });
});

