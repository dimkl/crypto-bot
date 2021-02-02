const assert = require('assert');
const crypto = require('crypto');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');

const API_KEY = process.env.BITSTAMP_API_KEY;
const API_SECRET = process.env.BITSTAMP_API_SECRET;

function getAuthHeaders(includeContent) {
    return {
        'x-auth': `BITSTAMP ${API_KEY}`,
        'x-auth-nonce': uuidv4(),
        'x-auth-timestamp': Date.now(),
        'x-auth-version': 'v2',
        'content-type': includeContent ? 'application/x-www-form-urlencoded' : undefined
    };
}

function getSignatureBody(httpVerb, url, headers, bodyStr = '') {
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

function signHeaders(headers, content) {
    headers['x-auth-signature'] = createSignature(content);
}

function createSignature(content) {
    const hmac = crypto.createHmac('sha256', API_SECRET);
    return hmac.update(content).digest('hex');
}

function verifyResponseSignature(headers, responseHeaders, responseContent) {
    const nonce = headers['x-auth-nonce'];
    const timestamp = headers['x-auth-timestamp'];
    const contentType = responseHeaders['content-type'];

    const signature = createSignature(nonce + timestamp + contentType + responseContent);
    const responseSignature = responseHeaders['x-server-auth-signature'];

    assert(signature === responseSignature, 'Signatures do not match');
}

module.exports = {
    getAuthHeaders,
    getSignatureBody,
    signHeaders,
    verifyResponseSignature,
}