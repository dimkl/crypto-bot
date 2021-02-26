const SDK = require('bitstamp-sdk');
const { handleErrorResponse } = require('../../helpers');
const { BitstampMapper } = require('../../mappers');

const apiCache = {};

class Api {
    constructor(options) {
        const { currencyPair } = options;

        this.api = SDK(options);
        this.mapper = new BitstampMapper(options);
        this.currencyPair = currencyPair;
    }

    async initialize() { }

    async getLiveValues() {
        try {
            const response = await this.api.ticker({ currencyPair: this.currencyPair });
            return this.mapper.liveValues(response);
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async getHourlyValues() {
        try {
            const response = await this.api.tickerHour({ currencyPair: this.currencyPair });
            return this.mapper.hourlyValues(response);
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async getAccountBalance() {
        try {
            const response = await this.api.balance();
            return this.mapper.accountBalance(response);
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async sell(limitValue, assets) {
        const defaultResponse = { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };

        try {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.sell({ currencyPair: this.currencyPair, ...body });

            return this.mapper.sell(response);
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async buy(limitValue, assets) {
        const defaultResponse = { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };

        try {
            const body = { amount: assets, price: limitValue };
            const response = await this.api.buy({ currencyPair: this.currencyPair, ...body });

            return this.mapper.buy(response);
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async getUserTransactions() {
        try {
            const response = await this.api.userTransactions({ limit: 10 });
            return this.mapper.userTransactions(response);
        } catch (err) {
            handleErrorResponse(err);
        }

        return [];
    }

    async getUserLastBuyTransaction() {
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
