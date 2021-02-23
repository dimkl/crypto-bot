const { splitCurrencies } = require('../helpers');

function getAvailableKeys(currencyPair) {
    return splitCurrencies(currencyPair).map(s => `${s}_available`);
}

function getFeeKey(currencyPair) {
    return `${currencyPair}_fee`;
}

function getTransactionType(type) {
    const mapping = { 0: 'deposit', 1: 'withdrawl', 2: 'market_trade', 14: 'sub_account_transfer' };
    return mapping[type];
}

function getExchangeRateKey(currencyPair) {
    return splitCurrencies(currencyPair).join('_');
}

function getExchangeType(capital) {
    return capital > 0 ? 'sell' : 'buy';
}

async function handleErrorResponse(err) {
    const { statusCode, body } = err.response || {};
    const { requestUrl } = err.request || {};
    if (err.message.includes('Timeout')) {
        console.log({ requestUrl, timings: JSON.stringify(err.timings) });
    } else if (statusCode) {
        console.log({ requestUrl, statusCode, body });
    } else {
        console.error(err);
    }
}

module.exports = {
    getFeeKey,
    getAvailableKeys,
    getTransactionType,
    getExchangeRateKey,
    getExchangeType,
    handleErrorResponse
};
