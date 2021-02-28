const { Balance, Price, Transaction, State, AuditLog } = require('../../src/models');
const SellService = require('../../src/services/sell');

const currencyPair = 'xlmeur';

function getState() {
  return State.find({ currencyPair, mode: 'sell' }).value();
}

describe("SellService", () => {
  beforeAll(() => {
    console.log = jest.fn();
  });

  beforeEach(() => {
    Balance.remove({ currencyPair }).write();
    Price.remove({ currencyPair }).write();
    Transaction.remove({ currencyPair }).write();
    State.remove({ currencyPair }).write();
    AuditLog.remove({ currencyPair, mode: 'sell' }).write();
  });

  describe('when value is rising', () => {
    describe('and change percentage has been reached', () => {
      describe('and comeback percentage has been reached', () => {
        test('sends sell limit order request and creates audit log', async () => {
          Balance.push({ currencyPair, capital: 0, assets: 50 }).write();
          Price.push({ currencyPair }).write();
          Transaction.push({ currencyPair, type: 'buy', assets: 50, exchangeRate: 100 }).write();
          State.push({ currencyPair, mode: 'sell' }).write();

          const config = {
            changePercentage: '0.1000',
            comebackPercentage: '0.0200',
            tradePercentage: '1.0000'
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

          const api = {
            sell: jest.fn((limitValue, assets) => {
              return { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
            })
          };
          const service = new SellService({ currencyPair, ...config }, api);


          for (const dt of data) {
            Price.find({ currencyPair }).assign(dt).write();
            await service.process({ currencyPair, ...config });

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
        })
      });
    });
  });
});
