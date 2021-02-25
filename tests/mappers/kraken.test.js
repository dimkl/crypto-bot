const KrakenMapper = require('../../src/mappers/kraken');

describe('KrakenMapper(options)', () => {
  beforeEach(() => {
    this.mapper = new KrakenMapper({ currencyPair: 'xlmeur' });
  });

  describe('constructor(options)', () => {
    test('currencyPair in ISO 4217', () => {
      expect(this.mapper.currencyPair).toBe('XLM/EUR');
    });
  });

  describe('liveValues(data)', () => {
    test('returns mapped data', () => {
      const data = {
        a: ['0.32000900', 840, '840.00000000'],
        b: ['0.31954600', 781, '781.56000000'],
        c: ['0.31954600', '58.44000000'],
        v: ['7628304.90751306', '8944471.28590555'],
        p: ['0.33508642', '0.33490530'],
        t: [4342, 4502],
        l: ['0.31550000', '0.31550000'],
        h: ['0.34771500', '0.34771500'],
        o: ['0.33391300', '0.33180600']
      };

      expect(this.mapper.liveValues(data)).toMatchObject({
        open: '0.33391300',
        currentBid: '0.31954600',
        currentAsk: '0.32000900',
        vwap: '0.33508642'
      });
    });
  });

  describe('hourlyValues(data)', () => {
    test('returns mapped data', () => {
      const data = [
        '1614293256.509166',
        '1614294000.000000',
        '0.32150000',
        '0.32680900',
        '0.31550000',
        '0.31922400',
        '0.32117896',
        '267191.01820533',
        274
      ];

      expect(this.mapper.hourlyValues(data)).toMatchObject({
        hourlyBid: '',
        hourlyAsk: '',
        hourlyOpen: '0.32150000',
        hourlyVwap: '0.32117896'
      });
    });
  });
});