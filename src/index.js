const { Config } = require('./models');
const { syncMode } = require('./modes');
const Api = require('./adapters/bitstamp');

['xrpeur', 'xlmeur', 'omgeur', 'btceur'].map((currencyPair) => {
	const config = Config.find({ currencyPair }).value() || {};
	const api = Api.getInstance({ currencyPair, ...config.auth });
	syncMode(config, api);
})
