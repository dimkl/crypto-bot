const SDK = require('bitstamp-sdk');
const {
    getAvailableKeys,
    splitCurrencies,
    getFeeKey,
    getExchangeRateKey,
    getTransactionType,
    getExchangeType,
    errorHandler
} = require('./helpers');
const { makePercentage, isLive } = require('../../helpers');

const cache = {};
class Api {
    constructor(options) {
        this.api = SDK(options);
        this.currencyPair = options && options.currencyPair;
    }

    async getCurrentValues() {
        const { open, bid, ask, vwap } = await this.api.ticker({ currencyPair: this.currencyPair });
        return { open, currentBid: bid, currentAsk: ask, vwap };
    }

    async getHourlyValues() {
        const { open, bid, ask, vwap } = await this.api.tickerHour({ currencyPair: this.currencyPair });
        return { hourlyBid: bid, hourlyAsk: ask, hourlyOpen: open, hourlyVwap: vwap };
    }

    async getAccountBalance() {
        if (!isLive()) return {};

        return errorHandler(async () => {
            const response = await this.api.balance();

            const [assetKey, capitalKey] = getAvailableKeys(this.currencyPair);
            const feeKey = getFeeKey(this.currencyPair);

            return {
                assets: response[assetKey],
                capital: response[capitalKey],
                feePercentage: makePercentage(response[feeKey])
            };
        });
    }

    async sell(limitValue, assets) {
        const defaultResponse = { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
        if (!isLive()) {
            return defaultResponse;
        }

        return errorHandler(async () => {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.sell({ currencyPair: this.currencyPair, ...body });

            const { id: orderId, datetime, price, amount } = response;
            return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
        }, defaultResponse);
    }

    async buy(limitValue, assets) {
        const defaultResponse = { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
        if (!isLive()) {
            return defaultResponse;
        }

        return errorHandler(async () => {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.buy({ currencyPair: this.currencyPair, ...body });

            const { id: orderId, datetime, price, amount } = response;
            return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
        }, defaultResponse);
    }

    async getUserTransactions() {
        if (!isLive()) return [];

        return errorHandler(async () => {
            const response = await this.api.userTransactions({ limit: 10 });

            const [assetsKey, capitalKey] = splitCurrencies(this.currencyPair);

            return response
                .filter(t => t[getExchangeRateKey(this.currencyPair)])
                .map(t => ({
                    transactionId: t.id,
                    orderId: t.order_id,
                    transactionType: getTransactionType(t.type),
                    capital: Math.abs(t[capitalKey]),
                    assets: Math.abs(t[assetsKey]),
                    feeAmount: t.fee,
                    datetime: t.datetime,
                    exchangeRate: t[getExchangeRateKey(this.currencyPair)],
                    exchangeType: getExchangeType(t[capitalKey])
                }));
        }, []);
    }

    async getUserLastBuyTransaction() {
        if (!isLive()) return {};

        const transactions = await this.getUserTransactions();
        return transactions.filter(t => t.exchangeType == 'buy').shift();
    }

    static getInstance(options) {
        const { apikey, apiSecret } = options;
        const cacheKey = `${apikey}-${apiSecret}`;

        if (!cache[cacheKey]) {
            cache[cacheKey] = new Api(options);
        }

        return cache[cacheKey];
    }
}
module.exports = Api;
