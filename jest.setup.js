module.exports = async () => {
  // truncate db
  const models = require("./src/models");
  Object.values(models).forEach(Model => Model.remove().write());

  const nock = require('nock');
  nock.disableNetConnect();
};