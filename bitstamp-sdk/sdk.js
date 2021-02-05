const got = require('got');
const { stringify } = require('querystring');
const { authorizedRequest } = require('./authorization');

const BASE_URL = 'https://www.bitstamp.net/api/v2';
const ENDPOINTS = Object.freeze([
  { path: 'ticker/{currencyPair}/', method: 'GET', defaultResponse: {} },
  { path: 'ticker_hour/{currencyPair}/', method: 'GET', defaultResponse: {} },
  // authorized endpoints
  { path: 'balance/', method: 'POST', authorized: true, defaultResponse: {} },
  { path: 'sell/{currencyPair}/', method: 'POST', authorized: true, defaultResponse: {} },
  { path: 'buy/{currencyPair}/', method: 'POST', authorized: true, defaultResponse: {} },
  { path: 'user_transactions/', method: 'POST', authorized: true, defaultResponse: [] }
]);

function replaceAndRemovePathParams(path, params) {
  return path.replace(/{(.*)}/, (_, $1) => {
    const res = params[$1]
    delete params[$1];
    return res;
  });
}

function camelCase(str) {
  return str.replace(/([-_](\w))/g, (_, $1, letter) => letter.toUpperCase());
}

function createApiMethod({ path, method }) {
  return (params) => {
    const url = `${BASE_URL}/${replaceAndRemovePathParams(path, params)}`;
    return got(url, { method }).json();
  };
}

function createAuthorizedApiMethod({ path, method }) {
  return async (params) => {
    const url = `${BASE_URL}/${replaceAndRemovePathParams(path, params)}`;
    const { responseBody } = await authorizedRequest(url, method, stringify(params));
    return JSON.parse(responseBody);
  };
}

module.exports = function Api() {
  return ENDPOINTS.reduce((api, apiConfig) => {
    const factory = apiConfig.authorized ? createAuthorizedApiMethod : createApiMethod;
    const name = camelCase(apiConfig.path.split('/').shift());
    return { ...api, [name]: factory(apiConfig) };
  }, {});
};
