const assert = require('assert');
const crypto = require('crypto');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');
const client = require('./client');

const API_KEY = process.env.BITSTAMP_API_KEY;
const API_SECRET = process.env.BITSTAMP_API_SECRET;

function _getAuthHeaders(includeContent) {
    return {
        'x-auth': `BITSTAMP ${API_KEY}`,
        'x-auth-nonce': uuidv4(),
        'x-auth-timestamp': Date.now(),
        'x-auth-version': 'v2',
        'content-type': includeContent ? 'application/x-www-form-urlencoded' : undefined
    };
}

function _getSignatureBody(httpVerb, url, headers, bodyStr = '') {
    const { host, pathname, query = "" } = new URL(url);

    const urlStr = httpVerb.toUpperCase() + host + pathname + query;
    let headerStr = [
        'x-auth-nonce',
        'x-auth-timestamp',
        'x-auth-version'
    ].reduce((acc, key) => acc + headers[key], '');

    if (bodyStr) {
        headerStr = headers['content-type'] + headerStr;
    }

    return headers['x-auth'] + urlStr + headerStr + bodyStr;
};

function _createSignature(content, apiSecret = API_SECRET) {
    const hmac = crypto.createHmac('sha256', apiSecret);
    return hmac.update(content).digest('hex');
}

function _verifyResponseSignature(headers, responseHeaders, responseContent, apiSecret) {
    const nonce = headers['x-auth-nonce'];
    const timestamp = headers['x-auth-timestamp'];
    const contentType = responseHeaders['content-type'];

    const signatureContent = nonce + timestamp + contentType + responseContent;
    const signature = _createSignature(signatureContent, apiSecret);
    const responseSignature = responseHeaders['x-server-auth-signature'];

    assert(signature === responseSignature, 'Signatures do not match');
}

async function authorizedRequest(url, method, body, { apiKey, apiSecret } = {}) {
    const headers = _getAuthHeaders(!!body, apiKey);
    const signatureContent = _getSignatureBody(method, url, headers, body);
    headers['x-auth-signature'] = _createSignature(signatureContent, apiSecret);

    const { headers: responseHeaders, body: responseBody } = await client(url, { headers, method, body });
    await _verifyResponseSignature(headers, responseHeaders, responseBody, apiSecret);

    return { responseHeaders, responseBody };
}

module.exports = { authorizedRequest };
