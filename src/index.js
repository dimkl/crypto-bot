const { Config } = require('./models');
const { sellMode, buyMode, syncMode } = require('./modes');

// ['xrpeur', 'xlmeur', 'btceur', 'etheur', 'omgeur', 'ltceur'].map((currencyPair) => {
['xrpeur', 'xlmeur', 'omgeur', 'btceur'].map((currencyPair) => {
	const { interval, buyMode: buyConfig, sellMode: sellConfig, auth: authConfig } = Config.find({ currencyPair }).value() || {};
	if (!interval) {
		console.log(`add configuration for ${currencyPair} in db.json`)
		return;
	}

	setInterval(() => {
		syncMode({ currencyPair, ...authConfig }).then(() => {
			sellMode({ currencyPair, ...sellConfig, ...authConfig });
			buyMode({ currencyPair, ...buyConfig, ...authConfig });
		});
	}, interval);
})
