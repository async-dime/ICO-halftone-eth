const { ethers } = require('hardhat');
require('dotenv').config({ path: '.env' });
const { HALFTONE_ETH_NFT_CONTRACT_ADDRESS } = require('../constants');

const main = async () => {
  // Address of the Halftone Eth NFT contract that previously deployed
  const halftoneEthNFTContractAddress = HALFTONE_ETH_NFT_CONTRACT_ADDRESS;

  /**
   * a ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
   * here halftoneEthTokenContract is a factory for instances of the HalftoneEthToken contract.
   */
  const halftoneEthTokenContract = await ethers.getContractFactory(
    'HalftoneEthToken'
  );

  const deployedHalftoneEthTokenContract =
    await halftoneEthTokenContract.deploy(halftoneEthNFTContractAddress);

  console.log(
    'Halftone Eth Token Contract Address:',
    deployedHalftoneEthTokenContract.address
  );
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.error('Error deploying the Halftone Eth Token contract', err);
    process.exit(1);
  }
};

runMain();
