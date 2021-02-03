const got = require('got');
const { stringify } = require('querystring');
const { authorizedRequest } = require('./authorization');
const {
    getAvailableKeys,
    splitCurrencies,
    getFeeKey,
    getExchangeRateKey,
    getTransactionType,
    getExchangeType
} = require('./helpers');
const { makePercentage, isLive } = require('../../helpers');

const BASE_URL = 'https://www.bitstamp.net/api/v2';

async function getCurrentValues(currencyPair) {
    const response = await got.get(`${BASE_URL}/ticker/${currencyPair}/`).json();
    return { open: response.open, currentBid: response.bid, currentAsk: response.ask, vwap: response.vwap };
}

async function getHourlyValues(currencyPair) {
    const response = await got.get(`${BASE_URL}/ticker_hour/${currencyPair}/`).json();
    return { hourlyBid: response.bid, hourlyAsk: response.ask, hourlyOpen: response.open, hourlyVwap: response.vwap };
}

async function getAccountBalance(currencyPair) {
    if (!isLive()) {
        return { assets: '', capital: '', feePercentage: '' };
    }

    const url = `${BASE_URL}/balance/`;
    const method = 'POST';

    try {
        const { responseBody } = await authorizedRequest(url, method);

        const [assetKey, capitalKey] = getAvailableKeys(currencyPair);
        const feeKey = getFeeKey(currencyPair);

        const response = JSON.parse(responseBody);
        return {
            assets: response[assetKey],
            capital: response[capitalKey],
            feePercentage: makePercentage(response[feeKey])
        };
    } catch (err) {
        const { statusCode, body } = err.response;
        console.error({ statusCode, body });
        return { assets: '', capital: '', feePercentage: '' };
    }
}

async function sell(limitValue, assets, currencyPair) {
    if (!isLive()) {
        return { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
    }

    const url = `${BASE_URL}/sell/${currencyPair}/`;
    const method = 'POST';

    const body = stringify({ amount: assets, price: limitValue, ioc_order: true });

    try {
        const { responseBody } = await authorizedRequest(url, method, body);

        const { id: orderId, datetime, price, amount } = JSON.parse(responseBody);
        return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount }
    } catch (err) {
        const { statusCode, body } = err.response;
        console.error({ statusCode, body });
    }

    return { orderId: '', soldValue: limitValue, soldAt: Date.noew(), soldAmount: assets };
}

async function buy(limitValue, assets, currencyPair) {
    if (!isLive()) {
        return { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
    }

    const url = `${BASE_URL}/buy/${currencyPair}/`;
    const method = 'POST';

    const body = stringify({ amount: assets, price: limitValue, ioc_order: true });

    try {
        const { responseBody } = await authorizedRequest(url, method, body);

        const { id: orderId, datetime, price, amount } = JSON.parse(responseBody);
        return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
    } catch (err) {
        debugger;
        const { statusCode, body } = err.response;
        console.error({ statusCode, body });
    }

    return { orderId: '', boughtValue: limitValue, boughtAt: Date.now(), boughtAmount: assets };
}

async function getUserTransactions(currencyPair) {
    if (!isLive()) {
        return {};
    }

    const url = `${BASE_URL}/user_transactions/`;
    const method = 'POST';
    const body = stringify({ limit: 10 });

    try {
        const { responseBody } = await authorizedRequest(url, method, body);

        const [assetsKey, capitalKey] = splitCurrencies(currencyPair);

        const transactions = JSON.parse(responseBody);
        return transactions
            .filter(t => t[getExchangeRateKey(currencyPair)])
            .map(t => ({
                transactionId: t.id,
                orderId: t.order_id,
                transactionType: getTransactionType(t.type),
                capital: t[capitalKey],
                assets: t[assetsKey],
                feeAmount: t.fee,
                datetime: t.datetime,
                exchangeRate: t[getExchangeRateKey(currencyPair)],
                exchangeType: getExchangeType(t[capitalKey])
            }));
    } catch (err) {
        const { statusCode, body } = err.response;
        console.error({ statusCode, body });
    }

    return {};
}

async function getUserLastBuyTransaction(currencyPair) {
    const { assets, exchangeRate } = await getUserTransactions(currencyPair)
        .filter(t => t.type == 'buy')
        .shift();
    return { assets, exchangeRate };
}

module.exports = {
    getAccountBalance,
    getCurrentValues,
    getHourlyValues,
    getUserTransactions,
    getUserLastBuyTransaction,
    buy,
    sell,
};
