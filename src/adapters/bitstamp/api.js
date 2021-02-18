const SDK = require('bitstamp-sdk');
const {
    getAvailableKeys,
    getFeeKey,
    getExchangeRateKey,
    getTransactionType,
    getExchangeType,
    handleErrorResponse
} = require('./helpers');
const { makePercentage, isLive, splitCurrencies } = require('../../helpers');

const apiCache = {};

class Api {
    constructor(options) {
        const { currencyPair } = options;

        this.api = SDK(options);
        this.currencyPair = currencyPair;
    }

    async getLiveValues() {
        try {
            const { open, bid, ask, vwap } = await this.api.ticker({ currencyPair: this.currencyPair });
            return { open, currentBid: bid, currentAsk: ask, vwap };
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async getHourlyValues() {
        try {
            const { open, bid, ask, vwap } = await this.api.tickerHour({ currencyPair: this.currencyPair });
            return { hourlyBid: bid, hourlyAsk: ask, hourlyOpen: open, hourlyVwap: vwap };
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async getAccountBalance() {
        if (!isLive()) return {};

        try {
            const response = await this.api.balance();

            const [assetKey, capitalKey] = getAvailableKeys(this.currencyPair);
            const feeKey = getFeeKey(this.currencyPair);

            return {
                assets: response[assetKey],
                capital: response[capitalKey],
                feePercentage: makePercentage(response[feeKey])
            };
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async sell(limitValue, assets) {
        const defaultResponse = { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
        if (!isLive()) return defaultResponse;

        try {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.sell({ currencyPair: this.currencyPair, ...body });

            const { id: orderId, datetime, price, amount } = response;
            return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async buy(limitValue, assets) {
        const defaultResponse = { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
        if (!isLive()) return defaultResponse;

        try {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.buy({ currencyPair: this.currencyPair, ...body });

            const { id: orderId, datetime, price, amount } = response;
            return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async getUserTransactions() {
        if (!isLive()) return [];

        try {
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
        } catch (err) {
            handleErrorResponse(err);
        }

        return [];
    }

    async getUserLastBuyTransaction() {
        if (!isLive()) return {};

        const transactions = await this.getUserTransactions();
        return transactions.filter(t => t.exchangeType == 'buy').shift();
    }

    static getInstance(options) {
        const { apikey, apiSecret } = options;
        const cacheKey = [apikey, apiSecret].filter(Boolean).join('-') || 'default';

        if (!apiCache[cacheKey]) {
            apiCache[cacheKey] = new Api(options);
        }

        return apiCache[cacheKey];
    }
}
module.exports = Api;
