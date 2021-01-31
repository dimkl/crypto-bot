const { URL } = require('url');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const API_KEY = process.env.BITSTAMP_API_KEY;
const API_SECRET = process.env.BITSTAMP_API_SECRET;

function getAuthHeaders() {
    return {
        'x-auth': `BITSTAMP ${API_KEY}`,
        'x-auth-nonce': uuidv4(),
        'x-auth-timestamp': Date.now(),
        'x-auth-version': 'v2',
    };
}

function getSignatureBody(httpVerb, url, headers, body) {
    const { host, pathname, query = "" } = new URL(url);

    const urlStr = httpVerb.toUpperCase() + host + pathname + query;
    const bodyStr = encodeURIComponent(body || '');
    let headerStr = [
        'x-auth-nonce',
        'x-auth-timestamp',
        'x-auth-version'
    ].reduce((acc, key) => acc + headers[key], '');

    if (headers['content-type']) {
        headerStr = headers['content-type'] + headersStr;
    }

    return headers['x-auth'] + urlStr + headerStr + bodyStr;
};

function signHeaders(headers, content) {
    headers['x-auth-signature'] = createSignature(content);
}

function createSignature(content){
    const hmac = crypto.createHmac('sha256', API_SECRET);
    return hmac.update(content).digest('hex');
}

function verifyResponseSignature(headers, responseHeaders, responseContent){
/*
string_to_sign = (nonce + timestamp + r.headers.get('Content-Type')).encode('utf-8') + r.content
signature_check = hmac.new(API_SECRET, msg=string_to_sign, digestmod=hashlib.sha256).hexdigest()
if not r.headers.get('X-Server-Auth-Signature') == signature_check:
    raise Exception('Signatures do not match')
    */
    const nonce = headers['x-auth-nonce'];
    const timestamp = headers['x-auth-timestamp'];
    const contentType = responseHeaders['content-type'];

    const signature = createSignature(nonce + timestamp + contentType + responseContent);
    const responseSignature = responseHeaders['x-server-auth-signature'];

    console.assert(signature === responseSignature, 'Signatures do not match');
}

module.exports = {
    getAuthHeaders,
    getSignatureBody,
    signHeaders,
    verifyResponseSignature,
}