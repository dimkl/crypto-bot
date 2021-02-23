// Docs: https://docs.kraken.com/websockets/

const WebSocket = require('faye-websocket');
const KrakenMapper = require('../../mappers/kraken');
const { convertCurrencyToISO4217 } = require('../../helpers');

const apiCache = {};

const API_KEY = process.env.KRAKEN_API_KEY;
const API_SECRET = process.env.KRAKEN_API_SECRET;

const IGNORED_EVENTS = Object.freeze(['heartbeat', 'systemStatus', 'subscriptionStatus']);
const EVENT_TO_MAPPER_METHODS = Object.freeze({ ticker: 'liveValues' });

class Api {
  constructor(options) {
    const { currencyPair } = options;
    const { apiKey = API_KEY, apiSecret = API_SECRET } = options;

    this.mapper = new KrakenMapper(options);

    this.client = new WebSocket.Client("wss://ws.kraken.com");
    this.currencyPair = convertCurrencyToISO4217(currencyPair);
    this.messages = {};
    this.handlers = {};
    this.channels = {};
  }

  async getLiveValues(callback) {
    const tickerMessage = {
      "event": "subscribe",
      "pair": [this.currencyPair],
      "subscription": {
        "name": "ticker"
      }
    };
    this.messages['ticker'] = this.messages['ticker'] || (JSON.stringify(tickerMessage))

    this.handlers['ticker'] = this.handlers['ticker'] || [];
    this.handlers['ticker'].push(callback)

    return this;
  }

  async getHourlyValues(callback) {
    // TODO: missing hourly values, should find a way to by pass it
    this.messages['hourly'] = null;

    this.handlers['hourly'] = this.handlers['hourly'] || [];
    this.handlers['hourly'].push(callback)
  }

  async getAccountBalance(callback) {
    // TODO: check if i should even implement it
    this.messages['balance'] = null;

    this.handlers['balance'] = this.handlers['balance'] || [];
    this.handlers['balance'].push(callback)
  }

  async getUserTransactions(callback) {
    // TODO: check if i should even implement it
    this.messages['userTransactions'] = null;

    this.handlers['userTransactions'] = this.handlers['userTransactions'] || [];
    this.handlers['userTransactions'].push(callback);
  }

  async getUserLastBuyTransaction(callback) {
    // TODO: check if i should even implement it
    this.messages['userBuyTransactions'] = null;

    this.handlers['userBuyTransactions'] = this.handlers['userBuyTransactions'] || [];
    this.handlers['userBuyTransactions'].push(callback);
  }

  async initialized() {
    if (this.isInitialized) return this.isInitialized;

    this.client.on('message', async (event) => {
      const eventData = JSON.parse(event.data);
      const eventName = eventData.event;

      if (eventName == 'subscriptionStatus') {
        this.channels[eventData.channelID] = eventData.channelName;
      }

      if (IGNORED_EVENTS.includes(eventName)) return;

      const channelID = eventData[0];
      const messageData = eventData[1];

      const handlerName = this.channels[channelID];
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
    });

    this.client.on('close', (event) => {
      console.log('close', event.code, event.reason);
      this.client = null;
    });

    this.isInitialized = new Promise((resolve, reject) => {
      this.client.on('open', (_) => {
        Object.values(this.messages).map(m => this.client.send(m));
        resolve();
      });
      this.client.on('error', reject);
    });

    return this.isInitialized;
  }

  async finished() {
    return new Promise((resolve, reject) => { });
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