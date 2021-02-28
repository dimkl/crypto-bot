const { Balance, Price, State, AuditLog } = require("../../src/models");
const BuyService = require("../../src/services/buy");
const buyData = require('../__fixtures__/buy.json');

const currencyPair = "xlmeur";
const config = {
  changePercentage: "0.0500",
  comebackPercentage: "0.0100",
  tradePercentage: "1.0000"
};

function getState() {
  return State.find({ currencyPair, mode: "buy" }).value();
}

function endBuying() {
  Balance.find({ currencyPair }).assign({ capital: 0 }).write();
}

function mockBuyApi() {
  return {
    buy: jest.fn((limitValue, assets) => {
      return { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
    })
  };
}

describe("BuyService", () => {
  beforeAll(() => {
    console.log = jest.fn();
  });

  beforeEach(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    State.remove({ currencyPair }).write();
    AuditLog.remove({ currencyPair, mode: 'buy' }).write();
  });

  describe('when there is no capital', () => {
    test('noop', async () => {
      Balance.push({ currencyPair, capital: 0, assets: 0 }).write();
      Price.push({ currencyPair }).write();
      State.push({ currencyPair, mode: "buy" }).write();

      const api = mockBuyApi();
      const service = new BuyService({ currencyPair, ...config }, api);

      for (const dt of buyData) {
        Price.find({ currencyPair }).assign(dt).write();
        await service.process();

        if (getState().final) endBuying();
      }

      const state = getState();
      expect(api.buy).not.toBeCalled();
      expect(state.current).toBeUndefined();
      expect(state.final).toBeUndefined();
      const auditLog = AuditLog.find({ currencyPair, mode: "buy" }).value();
      expect(auditLog).toBeUndefined();
    });
  });

  describe('when value is dropping', () => {
    describe('and change percentage has been reached', () => {
      describe('and comeback percentage has been reached', () => {
        test("sends buy limit order request and creates audit log", async () => {
          Balance.push({ currencyPair, capital: "26.50", assets: 0 }).write();
          Price.push({ currencyPair }).write();
          State.push({ currencyPair, mode: "buy" }).write();

          const api = mockBuyApi();
          const service = new BuyService({ currencyPair, ...config }, api);

          for (const dt of buyData) {
            Price.find({ currencyPair }).assign(dt).write();
            await service.process();

            if (getState().final) endBuying();
          }

          const state = getState();
          expect(api.buy).toBeCalledTimes(1);
          expect(api.buy).toBeCalledWith("0.30751", "86.1768");
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
        });
      });
    });
  });
});

