const got = require('got');
const { stringify } = require('querystring');
const { getSignatureBody, signHeaders, verifyResponseSignature, getAuthHeaders } = require('./authorization');
const { getAvailableKeys, getFeeKey } = require('./helpers');
const { makePercentage } = require('../../helpers');

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
            feePercentage: makePercentage(response[feeKey])
        };
    } catch (err) {
        const { statusCode, body }= err.response;
        console.error({statusCode, body});
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

async function sell(limitValue, assets, currencyPair) {
    if(["test", "development"].includes(process.env.NODE_ENV)){
      return {soldAt: Date.now(), soldValue: limitValue, soldAmount: assets };
    }

    const url = `${BASE_URL}/sell/${currencyPair}/`;
    const method = 'POST';

    const body = stringify({ amount: assets, price: limitValue, ioc_order: true });

    const headers = getAuthHeaders(true);
    const signatureContent = getSignatureBody(method, url, headers, body);
    signHeaders(headers, signatureContent);

    try {
        const { headers: responseHeaders, body: responseBody } = await got(url, { headers, method, body });
        await verifyResponseSignature(headers, responseHeaders, responseBody);

        const { id: orderId, datetime, price, amount } = JSON.parse(responseBody);
        return { orderId, soldAt: datetime, soldValue: price, soldAmount: amount }
    } catch (err) {
        debugger;
        const { statusCode, body }= err.response;
        console.error({statusCode, body});
    }

    return { orderId: '', soldValue: '', soldAt: '', soldAmount: ''};
}

async function buy(limitValue, assets, currencyPair) {
    if(["test", "development"].includes(process.env.NODE_ENV)){
      return {boughtAt: Date.now(), boughtValue: limitValue, boughtAmount: assets };
    }

    const url = `${BASE_URL}/buy/${currencyPair}/`;
    const method = 'POST';

    const body = stringify({ amount: assets, price: limitValue, ioc_order: true });

    const headers = getAuthHeaders(true);
    const signatureContent = getSignatureBody(method, url, headers, body);
    signHeaders(headers, signatureContent);

    try {
        const { headers: responseHeaders, body: responseBody } = await got(url, { headers, method, body });
        await verifyResponseSignature(headers, responseHeaders, responseBody);

        const { id: orderId, datetime, price, amount } = JSON.parse(responseBody);
        return { orderId, boughtAt: datetime, boughtValue: price, boughtAmount: amount }
    } catch (err) {
        debugger;
        const { statusCode, body }= err.response;
        console.error({statusCode, body});
    }

    return { orderId: '', boughtValue: '', boughtAt: '' };
}

module.exports = {
    getAccountBalance,
    getCurrentValues,
    getHourlyValues,
    buy,
    sell,
};
