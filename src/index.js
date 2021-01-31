const config = require('./config');
const { sellMode, buyMode, setupMode, snapshotDBMode } = require('./modes');

setupMode(config.currencyPair).then(() => {
	setInterval(() => setupMode(config.currencyPair), config.interval);
	setInterval(() => sellMode(config), config.interval);
	setInterval(() => buyMode(config), config.interval);
	setInterval(snapshotDBMode, config.backupInterval);
});

const conf = {...config, currencyPair: 'xrpeur'};
setupMode(conf.currencyPair).then(() => {
	setInterval(() => setupMode(conf.currencyPair), conf.interval);
	setInterval(() => sellMode(conf), conf.interval);
	setInterval(() => buyMode(conf), conf.interval);
	// setInterval(snapshotDBMode, conf.backupInterval);
});