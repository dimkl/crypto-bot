const { Balance, Price, State, AuditLog } = require("../../src/models");
const buyMode = require("../../src/modes/buy");

const currencyPair = "xlmeur";


function getState() {
  return State.find({ currencyPair, mode: "buy" }).value();
}

describe("buy mode", () => {
  beforeEach(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    State.remove({ currencyPair }).write();
    AuditLog.remove({ currencyPair, mode: 'buy' }).write();

    console.log = jest.fn();
  });

  test("buy: when value dropping, updates buying state with min value until comeback decrease from latest value", async () => {
    Balance.push({ currencyPair, capital: "26.50", assets: 0 }).write();
    Price.push({ currencyPair }).write();
    State.push({ currencyPair, mode: "buy" }).write();

    const data = require('./xmleur.json');
    const config = {
      changePercentage: "0.0500",
      comebackPercentage: "0.0100",
      tradePercentage: "1.0000",
    };

    for (const dt of data) {
      Price.find({ currencyPair }).assign(dt).write();
      await buyMode(currencyPair, config);

      // end buying
      if (getState().final) Balance.find({ currencyPair }).assign({ capital: 0 }).write();
    }

    const state = getState();
    expect(state.current).toBeNull();
    expect(state.final).toBe("0.30751");
    const auditLog = AuditLog.find({ currencyPair, mode: "buy" }).value();
    expect(auditLog).toMatchObject({
      createdAt: expect.anything(),
      amount: "86.1768",
      currencyPair: "xlmeur",
      mode: "buy",
      value: "0.30751"
    });
  })
});

