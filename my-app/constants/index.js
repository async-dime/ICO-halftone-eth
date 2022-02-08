import nftContractArtifact from '../utils/HalftoneEth.json';
import tokenContractArtifact from '../utils/HalftoneEthToken.json';

export const NFT_CONTRACT_ABI = nftContractArtifact.abi;
export const NFT_CONTRACT_ADDRESS =
  '0xB37FB929Bf6daf4524fDB89855DD80b4A8de92f2';
export const TOKEN_CONTRACT_ABI = tokenContractArtifact.abi;
export const TOKEN_CONTRACT_ADDRESS =
  '0xc64480E9117007126a3038703C85d9444E6af48f';

// NFT_CONTRACT_ABI is the abi of the Halftone Eth NFT contract that deployed before.
// NFT_CONTRACT_ADDRESS the address of the Halftone Eth NFT contract that deployed before.
// TOKEN_CONTRACT_ABI is the abi of the Halftone Eth token contract. To get the abi of the Token contract, go to hardhat-tutorial/artifacts/contracts/HalftoneEthToken.sol and then copy HalftoneEthToken.json file, put it in utils folder and import it to get the `.abi` value.
// TOKEN_CONTRACT_ADDRESS is the address of the Halftone Eth token contract.
