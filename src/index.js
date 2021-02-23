/*
# Crypto bot

## Architecture

| Sync |  ->  |DB|  <- |Trade|

- Each time a `sync` operation is trigger a `trade` operation should be triggered too.
- Each currency pair should be executed separately (cache the batch api calls for some milliseconds to reduce api usage)
- Each `sync` should have a retry if possible
- A `trade` operation is executed in the context of a currency pair
- Each `trade` operation can be either `sell` or `buy` and not both
- A `sync` operation can be executed in intervals or by waiting server to push data
- 
*/

const { Config } = require('./models');
const { syncMode } = require('./modes');
const { SellService, BuyService } = require('./services');
const Api = require('./adapters/bitstamp');

// ['xrpeur', 'xlmeur', 'btceur', 'etheur', 'omgeur', 'ltceur'].map((currencyPair) => {
['xrpeur', 'xlmeur', 'omgeur', 'btceur'].map((currencyPair) => {
	const { interval, buyMode: buyConfig, sellMode: sellConfig, auth: authConfig } = Config.find({ currencyPair }).value() || {};
	if (!interval) {
		console.log(`add configuration for ${currencyPair} in db.json`)
		return;
	}

	const api = Api.getInstance({ currencyPair, ...authConfig });
	const sellService = new SellService({ currencyPair, ...sellConfig }, api);
	const buyService = new BuyService({ currencyPair, ...buyConfig }, api);

	setInterval(() => {
		console.log(currencyPair, ' syncing: ', new Date())
		syncMode({ currencyPair }, api).then(() => {
			return Promise.all([
				sellService.process(),
				buyService.process()
			]).catch(console.error);
		}).catch(console.error);
	}, interval);
})
