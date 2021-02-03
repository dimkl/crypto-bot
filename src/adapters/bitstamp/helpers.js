
function getAvailableKeys(currencyPair) {
    return [currencyPair.slice(0, 3), currencyPair.slice(3)].map(s => `${s}_available`);
}

function getFeeKey(currencyPair) {
    return `${currencyPair}_fee`;
}

function getTransactionType(type){
    const mapping = { 0: 'deposit', 1: 'withdrawl', 2: 'market_trade', 14: 'sub_account_transfer'};
    return mapping[type];
}

function getExchangeRateKey(currencyPair){
    return getAvailableKeys(currencyPair).join('_');
}

module.exports = { 
    getFeeKey,
    getAvailableKeys,
    getTransactionType,
    getExchangeRateKey
};
