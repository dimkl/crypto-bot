
function getAvailableKeys(currencyPair) {
    return [currencyPair.slice(0, 3), currencyPair.slice(3)].map(s => `${s}_available`);
}

function getFeeKey(currencyPair) {
    return `${currencyPair}_fee`;
}

function isLive() {
    return !["test", "development"].includes(process.env.NODE_ENV)
}

module.exports = { getFeeKey, getAvailableKeys, isLive };