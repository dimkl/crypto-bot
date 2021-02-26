const { Config } = require('./models');
const { syncMode } = require('./modes');
const { SetupDBService } = require('./services');
const Api = require('./adapters/bitstamp');

['xrpeur', 'xlmeur', 'omgeur', 'btceur'].map(async (currencyPair) => {

	const setupDBService = new SetupDBService();
	await setupDBService.process(currencyPair);

	const config = Config.find({ currencyPair }).value() || {};
	const api = Api.getInstance({ currencyPair, ...config.auth });
	syncMode(config, api);
})
