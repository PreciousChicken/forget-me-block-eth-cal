var CalStore = artifacts.require("CalStore");

module.exports = function(deployer) {
  // Arguments are: contract
  deployer.deploy(CalStore);
};
