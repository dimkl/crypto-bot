const config = require('./config');
const { sellMode, buyMode, setupMode } = require('./modes');

// ['xrpeur', 'xlmeur', 'btceur', 'etheur', 'omgeur', 'ltceur'].map((currencyPair) => {
['xrpeur', 'xlmeur', 'btceur'].map((currencyPair) => {
	setInterval(() => {
		setupMode(currencyPair).then(() => {
			const state = {};
			// sellMode(currencyPair, config.buyMode, state);
			// buyMode(currencyPair, config.sellMode, state);
		});
	}, config.interval);
})
