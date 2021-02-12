const assert = require('assert');
const crypto = require('crypto');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');
const client = require('./client');

function _concatObjectKeys(obj, keys) {
    return keys.reduce((acc, key) => acc + obj[key], '');
}

function _getAuthHeaders(includeContent, apiKey) {
    return {
        'x-auth': `BITSTAMP ${apiKey}`,
        'x-auth-nonce': uuidv4(),
        'x-auth-timestamp': Date.now(),
        'x-auth-version': 'v2',
        'content-type': includeContent ? 'application/x-www-form-urlencoded' : undefined
    };
}

function _getSignatureBody(httpVerb, url, headers, bodyStr = '') {
    const { host, pathname, query = "" } = new URL(url);
    const urlStr = httpVerb.toUpperCase() + host + pathname + query;

    const headerKeys = ['x-auth-nonce', 'x-auth-timestamp', 'x-auth-version'];
    let headerStr = _concatObjectKeys(headers, headerKeys);

    if (bodyStr) {
        headerStr = headers['content-type'] + headerStr;
    }

    return headers['x-auth'] + urlStr + headerStr + bodyStr;
};

function _createSignature(content, apiSecret) {
    const hmac = crypto.createHmac('sha256', apiSecret);
    return hmac.update(content).digest('hex');
}

function _verifyResponseSignature(headers, responseHeaders, responseContent, apiSecret) {
    const headerStr = _concatObjectKeys(headers, ['x-auth-nonce', 'x-auth-timestamp']);
    const contentType = responseHeaders['content-type'];

    const signatureContent = headerStr + contentType + responseContent;
    const signature = _createSignature(signatureContent, apiSecret);
    const responseSignature = responseHeaders['x-server-auth-signature'];

    assert(signature === responseSignature, 'Signatures do not match');
}

async function authorizedRequest(url, method, body, authConfig) {
    const { apiKey, apiSecret } = authConfig;

    const headers = _getAuthHeaders(!!body, apiKey);
    const signatureContent = _getSignatureBody(method, url, headers, body);
    headers['x-auth-signature'] = _createSignature(signatureContent, apiSecret);

    const { headers: responseHeaders, body: responseBody } = await client(url, { headers, method, body });
    await _verifyResponseSignature(headers, responseHeaders, responseBody, apiSecret);

    return { responseHeaders, responseBody };
}

module.exports = { authorizedRequest };
