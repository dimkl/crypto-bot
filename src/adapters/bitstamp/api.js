const got = require('got');
const { getSignatureBody, signHeaders, verifyResponseSignature, getAuthHeaders } = require('./authorization');
const { getAvailableKeys, getFeeKey } = require('./helpers');

const BASE_URL = 'https://www.bitstamp.net/api/v2';

async function getAccountBalance(currencyPair) {
    const url = `${BASE_URL}/balance/`;
    const method = 'POST';

    const headers = getAuthHeaders();
    const signatureContent = getSignatureBody(method, url, headers);
    signHeaders(headers, signatureContent);

    try {
        const { headers: responseHeaders, body } = await got(url, { headers, method });
        await verifyResponseSignature(headers, responseHeaders, body);

        const [assetKey, capitalKey] = getAvailableKeys(currencyPair);
        const feeKey = getFeeKey(currencyPair);

        const response = JSON.parse(body);
        return {
            assets: response[assetKey],
            capital: response[capitalKey],
            feePercentage: response[feeKey]
        };
    } catch (err) {
        console.error(err);
        return { assets: '', capital: '', feePercentage: '' };
    }
}

async function getCurrentValues(currencyPair) {
    const response = await got.get(`${BASE_URL}/ticker/${currencyPair}/`).json();
    return { open: response.open, currentBid: response.bid, currentAsk: response.ask, vwap: response.vwap };
}

async function getHourlyValues(currencyPair) {
    const response = await got.get(`${BASE_URL}/ticker_hour/${currencyPair}/`).json();
    return { hourlyBid: response.bid, hourlyAsk: response.ask, hourlyOpen: response.open, hourlyVwap: response.vwap };
}

async function sell(limitValue, percentage, currencyPair) {
    // apply transaction
    // temporarily fix capital and assets in DB
    const DB = require('../../db');

    const capital = parseFloat(DB[currencyPair].capital);
    const boughtAssets = ((percentage * capital) / parseFloat(limitValue)).toFixed(4);
    const remainingCapital = ((1 - percentage) * capital).toFixed(4)

    // temp solution
    DB[currencyPair].assets = boughtAssets;
    DB[currencyPair].capital = remainingCapital;

    console.log({ capital, limitValue, boughtAssets, remainingCapital, percentage });

    return { asset: '', soldValue: limitValue };
}

async function buy(limitValue, percentage, currencyPair) {
    // apply transaction
    // temporarily fix capital and assets in DB
    const DB = require('../../db');

    const assets = parseFloat(DB[currencyPair].assets);
    const boughtCapital = ((percentage * assets) / parseFloat(limitValue)).toFixed(4);
    const remainingAssets = ((1 - percentage) * assets).toFixed(4)

    // temp solution
    DB[currencyPair].assets = remainingAssets;
    DB[currencyPair].capital = boughtCapital;

    console.log({ assets, limitValue, boughtCapital, remainingAssets, percentage });

    return { asset: '', boughtValue: limitValue };
}

module.exports = {
    getAccountBalance,
    getCurrentValues,
    getHourlyValues,
    buy,
    sell,
};
