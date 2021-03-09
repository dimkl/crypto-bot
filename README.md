# crypto-bot

Automatic trading crypto bot

## Bitstamp Api Docs

see: https://www.bitstamp.net/api/

## Requirements

- Node
- env: BITSTAMP_API_KEY, BITSTAMP_API_SECRET

## How to run

- install dependencies `npm i`
- setup bitstamp or kraken api key and secret in `.env` file

  ```bash
  BITSTAMP_API_KEY='KEY'
  BITSTAMP_API_SECRET='SECRET'
  # or
  KRAKEN_API_KEY='KEY'
  KRAKEN_API_SECRET='SECRET'
  ```

- execute script `cli/trade -s -a kraken -c xlmeur xrpeur`

## Development

## TODO

- [] support transactions and profit per transaction
- [] test sell & buy api calls using nock
- [] add buy & sell e2e flow with mock data
