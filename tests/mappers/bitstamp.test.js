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

  describe('_getExchangeType(assets)', () => {
    describe('when assets have positive value', () => {
      test('buy', () => {
        expect(this.mapper._getExchangeType('461.08380000')).toBe('buy');
      });
    });

    describe('when assets have negative value', () => {
      test('sell', () => {
        expect(this.mapper._getExchangeType('-0.00000480')).toBe('sell');
      });
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

  describe('userTransactions(data)', () => {
    test('returns mapped data', () => {
      const data = [
        {
          fee: '0.28008',
          omg: '9.03467742',
          order_id: 1328862346973184,
          datetime: '2021-02-14 00:57:41.193000',
          usd: 0,
          btc: 0,
          omg_eur: 6.2,
          type: '2',
          id: 150972147,
          eur: '-56.02'
        },
        {
          fee: '0.56579',
          order_id: 1328639918587905,
          id: 150776329,
          usd: 0,
          xrp_eur: 0.501,
          btc: 0,
          datetime: '2021-02-13 09:55:19.821000',
          type: '2',
          xrp: '-225.86385496',
          eur: '113.15779'
        },
        {
          fee: '0.00000',
          order_id: 1328533505667076,
          id: 150712216,
          usd: 0,
          xrp_eur: 0.524,
          btc: 0,
          datetime: '2021-02-13 02:40:04.980000',
          type: '2',
          xrp: '0.00085496',
          eur: '-0.00045'
        },
        {
          fee: '0.00000000',
          btc_usd: '0.00',
          datetime: '2021-02-13 02:26:15.364068',
          usd: 0,
          btc: '0.00000000',
          type: '14',
          id: 150710297,
          eur: '-100.00'
        },
        {
          xlm: '-0.00000480',
          fee: '0.00000',
          xlm_eur: 0.477,
          order_id: 1328524713971714,
          datetime: '2021-02-13 02:03:57.546000',
          usd: 0,
          btc: 0,
          type: '2',
          id: 150706592,
          eur: '0.00000'
        },
        {
          xlm: '-461.08380000',
          fee: '1.09968',
          xlm_eur: 0.477,
          order_id: 1328524713971714,
          datetime: '2021-02-13 02:03:49.523000',
          usd: 0,
          btc: 0,
          type: '2',
          id: 150706570,
          eur: '219.93697'
        }
      ];

      expect(this.mapper.userTransactions(data)).toMatchObject([
        {
          transactionId: 150706592,
          orderId: 1328524713971714,
          transactionType: 'market_trade',
          capital: 0,
          assets: 0.0000048,
          feeAmount: '0.00000',
          datetime: '2021-02-13 02:03:57.546000',
          exchangeRate: 0.477,
          exchangeType: 'sell'
        },
        {
          transactionId: 150706570,
          orderId: 1328524713971714,
          transactionType: 'market_trade',
          capital: 219.93697,
          assets: 461.0838,
          feeAmount: '1.09968',
          datetime: '2021-02-13 02:03:49.523000',
          exchangeRate: 0.477,
          exchangeType: 'sell'
        }
      ])
    });
  });
});