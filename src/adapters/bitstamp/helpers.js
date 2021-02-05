function splitCurrencies(currencyPair) {
    return [currencyPair.slice(0, 3), currencyPair.slice(3)];
}

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
    return capital < 0 ? 'sell' : 'buy';
}

async function errorHandler(handler) {
    try {
        const response = await handler();
        return response
    } catch (err) {
        const { statusCode, body } = err.response || {};
        if (!statusCode) {
            console.error(err);
        } else {
            console.error({ statusCode, body });
        }
        return {};
    }
}

module.exports = {
    splitCurrencies,
    getFeeKey,
    getAvailableKeys,
    getTransactionType,
    getExchangeRateKey,
    getExchangeType,
    errorHandler
};
