const { Config } = require('./models');
const { sellMode, buyMode, setupMode } = require('./modes');

// ['xrpeur', 'xlmeur', 'btceur', 'etheur', 'omgeur', 'ltceur'].map((currencyPair) => {
['xrpeur', 'xlmeur', 'omgeur'].map((currencyPair) => {
	const { interval, buyMode: buyConfig, sellMode: sellConfig } = Config.find({ currencyPair }).value() || {};
	if (!interval) {
		console.log(`add configuration for ${currencyPair} in db.json`)
		return;
	}

	setInterval(() => {
		setupMode(currencyPair).then(() => {
			sellMode(currencyPair, sellConfig);
			buyMode(currencyPair, buyConfig);
		});
	}, interval);
})
