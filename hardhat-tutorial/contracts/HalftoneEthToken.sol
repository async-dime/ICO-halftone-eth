// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IHalftoneEth.sol";

contract HalftoneEthToken is ERC20, Ownable {
    // Price of one Halftone Eth token
    uint256 public constant tokenPrice = 0.001 ether;
    // Each NFT would give the user 10 tokens
    // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination for the token
    // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
    // is actually equal to (10 ^ -18) tokens.
    // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
    // More information on this can be found in the Freshman Track Cryptocurrency tutorial.
    uint256 public constant tokensPerNFT = 10 * 10**18;
    // the max total supply is 10000 for Halftone Eth Tokens
    uint256 public constant maxTotalSupply = 10000 * 10**18;
    // HalftoneEthNFT contract instance
    IHalftoneEth HalftoneEthNFT;
    // Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _halftoneEthContract)
        ERC20("Halftone Eth Token", "HET")
    {
        HalftoneEthNFT = IHalftoneEth(_halftoneEthContract);
    }

    /**
     * @dev Mints `amount` number of CryptoDevTokens
     * Requirements:
     * - `msg.value` should be equal or greater than the tokenPrice * amount
     */
    function mint(uint256 amount) public payable {
        // the value of ether should be equal or greater than the tokenPrice * amount
        uint256 _requiredAmount = tokenPrice * amount;
        require(
            msg.value >= _requiredAmount,
            "Not enough ether to mint Halftone Eth Tokens"
        );
        // total tokens + amount <= 10000, otherwise revert the transaction
        uint256 amountWithDecimals = amount * 10**18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply of tokens available"
        );
        // call the internal function from Openzeppelin's ERC20 contract
        _mint(msg.sender, amountWithDecimals);
    }

    /**
     * @dev Mints tokens based on the number of NFT's held by the sender
     * Requirements:
     * - balance of Halftone Eth NFT's owned by the sender should be greater than 0
     * - Tokens should have not been claimed for all the NFTs owned by the sender
     */
    function claim() public {
        address sender = msg.sender;
        // Get the number of HalftoneEth NFT's held by a given sender address
        uint256 balance = HalftoneEthNFT.balanceOf(sender);
        // If the balance is zero, revert the transaction
        require(balance > 0, "You don't own any Halftone Eth NFT's");
        // amount to keeps track of number of unclaimed tokenIds
        uint256 amount = 0;
        // loop over the balance and get the token ID owned by `sender` at a given `index` of its token list
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = HalftoneEthNFT.tokenOfOwnerByIndex(sender, i);
            // if the tokenId has not been claimed, add it to the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount++;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        // If all the token Ids have been claimed, revert the transaction
        require(amount > 0, "You have already claimed all the token");
        // call the internal function from OpenZeppelin's ERC20 contract
        // Mints (`amount` * 10) number of HalftoneEthTokens for each NFT
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
