# crypto-bot

Automatic trading crypto bot

## Bitstamp Api Docs

see: https://www.bitstamp.net/api/

## Requirements

- Node
- env: BITSTAMP_API_KEY, BITSTAMP_API_SECRET

## How to run

```bash
export BITSTAMP_API_KEY='api_key' BITSTAMP_API_SECRET='api_secret'
npm i
npm start
```

## Development

## TODO

- support transactions and profit per transaction
- test sell & buy api calls using nock
- add buy & sell e2e flow with mock data
- websocket api
- improve sync mode by reusing endpoints with batch response data
