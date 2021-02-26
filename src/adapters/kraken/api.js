const KrakenClient = require('kraken-api');
const { handleErrorResponse, splitCurrencies, convertCurrencyToISO4217 } = require('../../helpers');
const KrakenMapper = require('../../mappers/kraken');

const apiCache = {};
const API_KEY = process.env.KRAKEN_API_KEY;
const API_SECRET = process.env.KRAKEN_API_SECRET;

class Api {
    constructor(options) {
        const { currencyPair } = options;
        const { apiKey = API_KEY, apiSecret = API_SECRET } = options;

        this.mapper = new KrakenMapper(options);

        this.client = new KrakenClient(apiKey, apiSecret);
        this.currencyPair = convertCurrencyToISO4217(currencyPair);
    }

    async initialize() { }

    async getToken() {
        try {
            const { result } = await this.client.api('GetWebSocketsToken');
            return result.token;
        } catch (err) {
            handleErrorResponse(err);
        }
    }

    async getLiveValues() {
        try {
            const response = await this.client.api('Ticker', { pair: this.currencyPair });
            return this.mapper.liveValues(Object.values(response.result).shift());
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async getHourlyValues() {
        // TODO: missing hourly values, should find a way to by pass it
        return {};
    }

    async getAccountBalance() {
        try {
            const response = await this.client.api('Balance');
            return this.mapper.accountBalance(response.result)
        } catch (err) {
            handleErrorResponse(err);
        }
        return {};
    }

    async sell(limitValue, assets) {
        const defaultResponse = { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };

        try {
            /*
            pair = asset pair
            type = type of order (buy/sell)
            ordertype = order type:
                market
                limit (price = limit price)
                stop-loss (price = stop loss price)
                take-profit (price = take profit price)
                stop-loss-limit (price = stop loss trigger price, price2 = triggered limit price)
                take-profit-limit (price = take profit trigger price, price2 = triggered limit price)
                settle-position
            price = price (optional.  dependent upon ordertype)
            price2 = secondary price (optional.  dependent upon ordertype)
            volume = order volume in lots
            */
            const body = { volume: assets, price: limitValue, type: 'sell', ordertype: 'limit' };
            const response = await this.cleint.addOrder({ pair: this.currencyPair, ...body });
            /*
            descr = order description info
            order = order description
            close = conditional close order description (if conditional close set)
            txid = array of transaction ids for order (if order was added successfully)
            */
            return {};
            // const { id: orderId, datetime, price, amount } = response;
            // return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async buy(limitValue, assets) {
        const defaultResponse = { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };

        try {
            /*
            pair = asset pair
            type = type of order (buy/sell)
            ordertype = order type:
                market
                limit (price = limit price)
                stop-loss (price = stop loss price)
                take-profit (price = take profit price)
                stop-loss-limit (price = stop loss trigger price, price2 = triggered limit price)
                take-profit-limit (price = take profit trigger price, price2 = triggered limit price)
                settle-position
            price = price (optional.  dependent upon ordertype)
            price2 = secondary price (optional.  dependent upon ordertype)
            volume = order volume in lots
            */
            const body = { volume: assets, price: limitValue, type: 'buy', ordertype: 'limit' };
            const response = await this.cleint.addOrder({ pair: this.currencyPair, ...body });
            /*
            descr = order description info
            order = order description
            close = conditional close order description (if conditional close set)
            txid = array of transaction ids for order (if order was added successfully)
            */
            return {};
            // const { id: orderId, datetime, price, amount } = response;
            // return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
        } catch (err) {
            handleErrorResponse(err);
        }

        return defaultResponse;
    }

    async getUserTransactions() {
        return [];
    }

    async getUserLastBuyTransaction() {
        const transactions = await this.getUserTransactions();
        return transactions.filter(t => t.exchangeType == 'buy').shift();
    }

    static getInstance(options) {
        const { apikey, apiSecret, currencyPair } = options;
        const cacheKey = [apikey, apiSecret, currencyPair].filter(Boolean).join('-');

        if (!cacheKey || !apiCache[cacheKey]) {
            apiCache[cacheKey] = new Api(options);
        }

        return apiCache[cacheKey];
    }
}

module.exports = Api;
