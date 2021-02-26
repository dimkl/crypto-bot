const BitstampMapper = require('../../src/mappers/bitstamp');

describe('BitstampMapper(options)', () => {
  beforeEach(() => {
    this.mapper = new BitstampMapper({ currencyPair: 'xlmeur' });
  });

  describe('constructor(options)', () => {
    test('currencyPair', () => {
      expect(this.mapper.currencyPair).toBe('xlmeur');
    });
  });

  describe('properties', () => {
    test('availableKeys', () => {
      expect(this.mapper.availableKeys).toEqual([
        'xlm_available',
        'eur_available'
      ]);
    });

    test('feeKey', () => {
      expect(this.mapper.feeKey).toBe('xlmeur_fee');
    });

    test('exchangeRateKey', () => {
      expect(this.mapper.exchangeRateKey).toBe('xlm_eur');
    });
  });

  describe('_getTransactionType(type)', () => {
    test('deposit', () => {
      expect(this.mapper._getTransactionType(0)).toBe('deposit');
    });

    test('withdrawl', () => {
      expect(this.mapper._getTransactionType(1)).toBe('withdrawl');
    });

    test('market_trade', () => {
      expect(this.mapper._getTransactionType(2)).toBe('market_trade');
    });

    test('sub_account_transfer', () => {
      expect(this.mapper._getTransactionType(14)).toBe('sub_account_transfer');
    });
  });

  describe('_getExchangeType(capital)', () => {
    test('buy', () => {
      expect(this.mapper._getExchangeType(0)).toBe('buy');
    });

    test('sell', () => {
      expect(this.mapper._getExchangeType(100)).toBe('sell');
    });
  });

  describe('liveValues(data)', () => {
    test('returns mapped data', () => {
      const data = {
        open: '0.33391300',
        bid: '0.31954600',
        ask: '0.32000900',
        vwap: '0.33508642'
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
      const data = {
        open: '0.33391300',
        bid: '0.31954600',
        ask: '0.32000900',
        vwap: '0.33508642'
      };

      expect(this.mapper.hourlyValues(data)).toMatchObject({
        hourlyBid: '0.31954600',
        hourlyAsk: '0.32000900',
        hourlyOpen: '0.33391300',
        hourlyVwap: '0.33508642'
      });
    });
  });

  describe('accountBalance(data)', () => {
    test('returns mapped data', () => {
      const data = {
        eur_available: '20.00000000',
        xlm_available: '960.31161000',
        xlmeur_fee: 0.5
      };
      expect(this.mapper.accountBalance(data)).toMatchObject({
        assets: '960.31161000',
        capital: '20.00000000',
        feePercentage: '0.0050'
      });
    });
  });

  describe('sell(data)', () => {
    test('returns mapped data', () => {
      const now = Date.now();

      const data = {
        price: '0.60000',
        amount: '20.00000000',
        datetime: now,
        id: 'O4T556-LSPCF-JNWZPH'
      };

      expect(this.mapper.sell(data)).toMatchObject({
        orderId: 'O4T556-LSPCF-JNWZPH',
        soldAt: now,
        soldValue: '0.60000',
        soldAmount: '20.00000000'
      })
    })
  });

  describe('buy(data)', () => {
    test('returns mapped data', () => {
      const now = Date.now();

      const data = {
        price: '0.60000',
        amount: '20.00000000',
        datetime: now,
        id: 'O4T556-LSPCF-JNWZPH'
      };

      expect(this.mapper.buy(data)).toMatchObject({
        orderId: 'O4T556-LSPCF-JNWZPH',
        boughtAt: now,
        boughtValue: '0.60000',
        boughtAmount: '20.00000000'
      })
    })
  });
});