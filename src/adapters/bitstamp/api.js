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

const api = SDK();

async function getCurrentValues(currencyPair) {
    const { open, bid, ask, vwap } = await api.ticker({ currencyPair });
    return { open, currentBid: bid, currentAsk: ask, vwap };
}

async function getHourlyValues(currencyPair) {
    const { open, bid, ask, vwap } = await api.tickerHour({ currencyPair });
    return { hourlyBid: bid, hourlyAsk: ask, hourlyOpen: open, hourlyVwap: vwap };
}

async function getAccountBalance(currencyPair) {
    if (!isLive()) return {};

    return errorHandler(async () => {
        const response = await api.balance();

        const [assetKey, capitalKey] = getAvailableKeys(currencyPair);
        const feeKey = getFeeKey(currencyPair);

        return {
            assets: response[assetKey],
            capital: response[capitalKey],
            feePercentage: makePercentage(response[feeKey])
        };
    });
}

async function sell(limitValue, assets, currencyPair) {
    const defaultResponse = { soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
    if (!isLive()) {
        return defaultResponse;
    }

    return errorHandler(async () => {
        const body = { amount: assets, price: limitValue, ioc_order: true };
        const response = await api.sell({ currencyPair, ...body });

        const { id: orderId, datetime, price, amount } = response;
        return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount };
    }, defaultResponse);
}

async function buy(limitValue, assets, currencyPair) {
    const defaultResponse = { boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
    if (!isLive()) {
        return defaultResponse;
    }

    return errorHandler(async () => {
        const body = { amount: assets, price: limitValue, ioc_order: true };
        const response = await api.buy({ currencyPair, ...body });

        const { id: orderId, datetime, price, amount } = response;
        return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
    }, defaultResponse);
}

async function getUserTransactions(currencyPair) {
    if (!isLive()) return [];

    return errorHandler(async () => {
        const response = await api.userTransactions({ limit: 10 });

        const [assetsKey, capitalKey] = splitCurrencies(currencyPair);

        return response
            .filter(t => t[getExchangeRateKey(currencyPair)])
            .map(t => ({
                transactionId: t.id,
                orderId: t.order_id,
                transactionType: getTransactionType(t.type),
                capital: Math.abs(t[capitalKey]),
                assets: Math.abs(t[assetsKey]),
                feeAmount: t.fee,
                datetime: t.datetime,
                exchangeRate: t[getExchangeRateKey(currencyPair)],
                exchangeType: getExchangeType(t[capitalKey])
            }));
    }, []);
}

async function getUserLastBuyTransaction(currencyPair) {
    if (!isLive()) return {};

    const transactions = await getUserTransactions(currencyPair);
    return transactions.filter(t => t.exchangeType == 'sell').shift();
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
