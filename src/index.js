const config = require('./config');
const { sellMode, buyMode, setupMode, snapshotDBMode } = require('./modes');

['xrpeur', 'xlmeur'].map((currencyPair) => {
	setupMode(currencyPair).then(() => {
		const state = {};
		setInterval(() => setupMode(currencyPair), config.interval);
		setInterval(() => sellMode(currencyPair, config.buyMode, state), config.interval);
		setInterval(() => buyMode(currencyPair, config.sellMode, state), config.interval);
		setInterval(snapshotDBMode, 2 * config.interval);
	});
})
