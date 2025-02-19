require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.21",
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};
