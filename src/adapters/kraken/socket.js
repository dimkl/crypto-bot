// Docs: https://docs.kraken.com/websockets/

const WebSocket = require('faye-websocket');
const RestApi = require('./api');
const KrakenMapper = require('../../mappers/kraken');
const { convertCurrencyToISO4217 } = require('../../helpers');

const apiCache = {};

const IGNORED_EVENTS = Object.freeze(['heartbeat', 'systemStatus', 'subscriptionStatus']);
const EVENT_TO_MAPPER_METHODS = Object.freeze({
  ticker: 'liveValues',
  'ohlc-60': 'hourlyValues',
  ownTrades: 'userTransactions'
});

class Api {
  constructor(options) {
    const { currencyPair } = options;

    this.restClient = RestApi.getInstance(options);
    this.mapper = new KrakenMapper(options);

    this.currencyPair = convertCurrencyToISO4217(currencyPair);
    this.messages = {};
    this.privateMessages = {};
    this.handlers = {};
    this.channels = {};
    this.isInitialized = {};
  }

  _publicMessage(channel, params = {}) {
    return {
      "event": "subscribe",
      "pair": [this.currencyPair],
      "subscription": {
        "name": channel,
        ...params
      }
    }
  }

  _privateMessage(channel, token, params = {}) {
    return {
      "event": "subscribe",
      "subscription": {
        "name": channel, //eg "ownTrades", "openOrders"
        "token": token,
        ...params
      }
    }
  }

  _getChannelID(eventData, isPublic) {
    return isPublic ? eventData[0] : undefined;
  }

  _getMessageData(eventData, isPublic) {
    return isPublic ? eventData[1] : eventData[0];
  }

  _getChannelName(eventData, isPublic) {
    return isPublic ? eventData[3] : eventData[1];
  }

  async _handleMessage(isPublic, event) {
    const eventData = JSON.parse(event.data);
    const eventName = eventData.event;

    if (eventName == 'subscriptionStatus') {
      const key = eventData.channelID || eventData.channelName;
      this.channels[key] = eventData.channelName;
    }

    if (IGNORED_EVENTS.includes(eventName)) return;

    const channelID = this._getChannelID(eventData, isPublic);
    const channelName = this._getChannelName(eventData, isPublic);
    const messageData = this._getMessageData(eventData, isPublic)

    const handlerName = this.channels[channelID || channelName];
    if (!handlerName) {
      console.log(new Date(), 'no handler found for', eventData);
      return;
    }

    const mapperMethod = EVENT_TO_MAPPER_METHODS[handlerName];
    if (!mapperMethod) {
      console.log(new Date(), 'no mapper method found for', handlerName, 'and data', eventData);
      return;
    }

    this.handlers[handlerName].forEach(async handler => {
      await handler(this.mapper[mapperMethod](messageData))
    })
  }

  async _initializeClient(client, messages, isPublic = true) {
    if (Object.keys(messages).length == 0) return;
    if (this.isInitialized[client.url]) return this.isInitialized[client.url];

    client.on('message', this._handleMessage.bind(this, isPublic));
    client.on('close', (event) => {
      console.log('close', event.code, event.reason);
      client = null;
    });

    this.isInitialized[client.url] = new Promise((resolve, reject) => {
      client.on('open', (_) => {
        Object.values(messages).map(m => client.send(m));
        resolve();
      });
      client.on('error', reject);
    });

    return this.isInitialized[client.url];
  }

  async getLiveValues(callback) {
    const tickerMessage = this._publicMessage('ticker');
    this.messages['ticker'] = JSON.stringify(tickerMessage);

    this.handlers['ticker'] = this.handlers['ticker'] || [];
    this.handlers['ticker'].push(callback);

    return this;
  }

  async getHourlyValues(callback) {
    const ohlcMessage = this._publicMessage('ohlc', { interval: 60 });
    this.messages['ohlc-60'] = JSON.stringify(ohlcMessage);

    this.handlers['ohlc-60'] = this.handlers['ohlc-60'] || [];
    this.handlers['ohlc-60'].push(callback);
  }

  async getAccountBalance(callback) {
    const balance = await this.restClient.getAccountBalance();
    return callback(balance);
  }

  async getUserTransactions(callback) {
    const token = await this.restClient.getToken();
    const ownTradesMessage = this._privateMessage('ownTrades', token);
    this.privateMessages['ownTrades'] = JSON.stringify(ownTradesMessage);

    this.handlers['ownTrades'] = this.handlers['ownTrades'] || [];
    this.handlers['ownTrades'].push(callback);
  }

  async getUserLastBuyTransaction(callback) {
    // TODO: check if i should even implement it
  }

  async initialize() {
    if (this.isInitialized.all) return this.isInitialized.all;

    const publicClient = new WebSocket.Client("wss://ws.kraken.com");
    const privateClient = new WebSocket.Client("wss://ws-auth.kraken.com");

    this.isInitialized.all = Promise.all([
      this._initializeClient(publicClient, this.messages),
      this._initializeClient(privateClient, this.privateMessages, false),
    ]);

    return this.isInitialized.all;
  }

  static getInstance(options) {
    const { apikey, apiSecret } = options;
    const cacheKey = [apikey, apiSecret].filter(Boolean).join('-');

    if (!cacheKey || !apiCache[cacheKey]) {
      apiCache[cacheKey] = new Api(options);
    }

    return apiCache[cacheKey];
  }
}

module.exports = Api;