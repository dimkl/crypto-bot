const config = require('./config');
const { sellMode, buyMode, setupMode, snapshotDBMode } = require('./modes');

['xrpeur', 'xlmeur'].map((currencyPair) => {
	setupMode(currencyPair).then(() => {
		const state = {};
		setInterval(() => setupMode(currencyPair), config.interval);
		setInterval(() => sellMode(currencyPair, config, state), config.interval);
		setInterval(() => buyMode(currencyPair, config, state), config.interval);
		setInterval(snapshotDBMode, config.backupInterval);
	});
})
