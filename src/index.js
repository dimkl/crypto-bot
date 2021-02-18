const { Config } = require('./models');
const { sellMode, buyMode, syncMode } = require('./modes');
const Api = require('./adapters/bitstamp');

// ['xrpeur', 'xlmeur', 'btceur', 'etheur', 'omgeur', 'ltceur'].map((currencyPair) => {
['xrpeur', 'xlmeur', 'omgeur', 'btceur'].map((currencyPair) => {
	const { interval, buyMode: buyConfig, sellMode: sellConfig, auth: authConfig } = Config.find({ currencyPair }).value() || {};
	if (!interval) {
		console.log(`add configuration for ${currencyPair} in db.json`)
		return;
	}

	setInterval(() => {
		const api = Api.getInstance({ currencyPair, ...authConfig });

		syncMode({ currencyPair }, api).then(() => {
			sellMode({ currencyPair, ...sellConfig }, api).catch(console.error);
			buyMode({ currencyPair, ...buyConfig }, api).catch(console.error);
		}).catch(console.error);
	}, interval);
})
