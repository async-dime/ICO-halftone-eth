import Head from 'next/head';
import Web3Modal from 'web3modal';
import Toast from '../components/Toast';
import styles from '../styles/Home.module.css';
import ProgressBar from '@badrap/bar-of-progress';
import { useEffect, useRef, useState } from 'react';
import { BigNumber, Contract, providers, utils } from 'ethers';
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from '../constants';

const BarOfProgress = new ProgressBar({
  size: 4,
  color: '#d38312',
  className: `${styles.progressBar}`,
  delay: 150,
});

export default function Home() {
  // create a BigNumber '0'
  const zero = BigNumber.from(0);
  // walletConnected keeps track of whether the user's wallet is connected or nah
  const [walletConnected, setWalletConnected] = useState(false);
  // loading set to true if there's a transaction in progress
  const [loading, setLoading] = useState(false);
  // tokensToBeClaimed keeps track of the number of tokens that can be mined
  // based on the Halftone Eth NFT's held by the user for which they haven't claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // balanceOfHalftoneEthTokens keeps track of HalftoneEth token balance by address
  const [balanceOfHalftoneEthTokens, setBalanceOfHalftoneEthTokens] =
    useState(zero);
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensMinted is the total number of tokens that have been minted out of max (10000 unit) until current time
  const [tokensMinted, setTokensMinted] = useState(zero);
  // create a reference to the Web3 Modal (for connecting to Metamask) that persists as long as the page is open
  const web3ModalRef = useRef();

  const [list, setList] = useState([]); // list of toasts

  const TWITTER_HANDLE = 'async_dime';
  const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

  let toastProperties = null;

  const showToast = (type, text) => {
    const id = Date.now();
    const desc = text.toString();

    switch (type) {
      case 'success':
        toastProperties = {
          id,
          title: 'Success',
          description: desc,
          backgroundColor: '#5cb85c',
          icon: 'checkIcon',
        };
        break;
      case 'error':
        toastProperties = {
          id,
          title: 'Error',
          description: desc,
          backgroundColor: '#d9534f',
          icon: 'errorIcon',
        };
        break;
      default:
        setList([]);
    }
    setList([...list, toastProperties]);
  };

  /**
   * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
   */
  const getTokensToBeClaimed = async () => {
    try {
      // Get the provider from web3Modal => Metamask
      // No need for `Signer` here as this is a read-only call
      const provider = await getProviderOrSigner();
      // create an instance of NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Get the signer to extract the address of the user that currently connected to MetaMask
      const signer = await getProviderOrSigner(true);
      // Get the address of the user
      const address = await signer.getAddress();
      // call the balanceOf method from the NFT contract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      // balance is BigNumber and thus we would compare it with Big Number 'zero'
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount to keeps track of the number of unclaimed tokens
        var amount = 0;
        // For all the NFT's check if tokens have already been claimed
        // Only increase the amount if the tokens have not been claimed
        // for all NFT's (for a given tokenId)
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        // tokensToBeClaimed's value is initialized as BigNumber,
        // thus `amount` need to be converted first to Big Number and set its value
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  /**
   * getBalanceOfHalftoneEthTokens: checks the balance of Halftone Eth tokens held by an address
   */
  const getBalanceOfHalftoneEthTokens = async () => {
    try {
      // Get the provider from web3Modal => Metamask
      // No need for `Signer` here as this is a read-only call
      const provider = await getProviderOrSigner();
      // Create an instance of the token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Get the signer to extract the address of the user that currently connected to MetaMask
      const signer = await getProviderOrSigner(true);
      // Get the address of the user
      const address = await signer.getAddress();
      // call the balanceOf method from the NFT contract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      // balance is already Big Number, so no need to convert it before setting it
      setBalanceOfHalftoneEthTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfHalftoneEthTokens(zero);
    }
  };

  /**
   * mintHalftoneEthToken: mints an `amount` of Halftone Eth tokens to an address
   */
  const mintHalftoneEthToken = async (amount) => {
    try {
      // This is a write transaction, so we need a `Signer`
      const signer = await getProviderOrSigner(true);
      // Create an instance of the tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Each token is of `0.001 ether` => The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of Halftone Eth token which is "0.001" eth
        // We are parsing `0.001` string to ether using the utils lib from ethers.js
        value: utils.parseEther(value.toString()),
      });
      BarOfProgress.start(15000);
      setLoading(true);
      await tx.wait();
      BarOfProgress.finish();
      setLoading(false);
      showToast('success', 'Successfully minted Halftone Ethereum Tokens!');
      await getBalanceOfHalftoneEthTokens();
      await getTotalTokensMinted();
      await getTotalTokensMinted();
    } catch (err) {
      console.error(err);
      showToast(
        'error',
        `Failed to mint Halftone Ethereum Token : ${err.message}`
      );
    }
  };

  /**
   * claimHalftoneEthTokens: Helps the user claim Crypto Dev Tokens
   */
  const claimHalftoneEthTokens = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      BarOfProgress.start(15000);
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      BarOfProgress.finish();
      setLoading(false);
      showToast('success', 'Successfully claimed Halftone Ethereum Tokens!');
      await getBalanceOfHalftoneEthTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
      showToast(
        'error',
        `Failed to claim Halftone Ethereum Token : ${err.message}`
      );
    }
  };

  /**
   * getTotalTokensMinted: Retrieves the total number of tokens have been minted
   * out of max (10000 unit) until current time
   */
  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal => Metamask
      // No need for `Signer` here as this is a read-only call
      const provider = await getProviderOrSigner();
      // create an instance of the token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Get all tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a `Provider` or `Signer` object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` object is used to read data from the blockchain, while a `Signer` object is used
   * to write data to the blockchain
   *
   * @param {*} needSigner - true if you need the signer, default is false
   */
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      // connect to MetaMask
      // since we store `web3modal` as a reference, we need to access the `current` value
      // to access the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      // if the user isn't connected to MetaMask account, we throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 4) {
        showToast('error', 'Change the network to Rinkeby');
        throw new Error('Please connect to the Rinkeby testnet');
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      setWalletConnected(true);
      return web3Provider;
    } catch (err) {
      console.error(err);
      showToast('error', 'Please install MetaMask!');
    }
  };

  /**
   * connectWallet: Connect to the MetaMask wallet
   */
  const connectWallet = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        // get the provider from web3modal (metamask)
        // for the first-time user, it prompts user to connect their wallet
        await getProviderOrSigner();
      } else {
        showToast('error', 'Please install MetaMask!');
        return;
      }
    } catch (err) {
      console.error(err);
      showToast('error', err.message);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    try {
      if (!ethereum) {
        showToast('error', 'Make sure you have MetaMask!');
        return;
      } else {
        showToast('success', `We have the ethereum object: ${ethereum}`);

        const accounts = await ethereum.request({ method: 'eth_accounts' }); // Check if we're authorized to access the user's wallet

        if (accounts.length !== 0) {
          const account = accounts[0];
          showToast('success', `Found a wallet address: ${account}.`);

          // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
          if (!walletConnected) {
            // Assign the Web3Modal class to the reference object by setting it's `current` value
            // The `current` value is persisted throughout as long as this page is open
            web3ModalRef.current = new Web3Modal({
              network: 'rinkeby',
              providerOptions: {},
              disableInjectedProvider: false,
            });
            connectWallet();
            getTotalTokensMinted();
            getBalanceOfHalftoneEthTokens();
            getTokensToBeClaimed();
          }
        } else {
          showToast('error', 'Please connect your MetaMask wallet.');
          return;
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * useEffects are used to react to changes in state of the website
   * The array at the end of function call represents what state changes will trigger this effect
   * In this case, whenever the value of `walletConnected` changes - this effect will be called
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    if (walletConnected) {
      // If we are currently waiting for something, return a loading button
      if (loading) {
        return (
          <div>
            <button className={styles.button}>Loading...</button>
          </div>
        );
      }
      // If tokens to be claimed are greater than 0, return a claim button
      if (tokensToBeClaimed > 0) {
        return (
          <div>
            <div className={styles.description}>
              <span className={styles.claimableTokens}>
                <b>{tokensToBeClaimed * 10}</b>
              </span>{' '}
              HETs can be claimed!
            </div>
            <button className={styles.button} onClick={claimHalftoneEthTokens}>
              Claim HET 🪙
            </button>
          </div>
        );
      }
      // If user doesn't have any tokens to claim, show the mint button
      return (
        <div style={{ display: 'flex-col' }}>
          <div>
            <input
              type="number"
              placeholder="Amount of HET"
              // BigNumber.from converts the `e.target.value` to a BigNumber
              onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
              className={styles.input}
            />
          </div>

          <button
            className={styles.button}
            disabled={!(tokenAmount > 0)}
            onClick={() => mintHalftoneEthToken(tokenAmount)}
          >
            Mint HET 🪙
          </button>
        </div>
      );
    } else if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Halftone Ethereum ICO</title>
        <meta name="description" content="Halftone-Eth-ICO-Dapp" />
        <link rel="icon" href="/halftone-ethx50.ico" />
      </Head>
      <div className={styles.main}>
        <Toast toastList={list} />
        <div>
          <h1 className={styles.header}>Halftone-Ethereum ICO</h1>
          <div className={styles.description}>
            This is a page for claiming or minting Halftone-Ethereum (HET) token.
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted{' '}
                <span className={styles.mintedTokens}>
                  <b>{utils.formatEther(balanceOfHalftoneEthTokens)}</b>
                </span>{' '}
                Halftone-Ethereum tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall{' '}
                <span className={styles.mintedTokens}>
                  <b>{utils.formatEther(tokensMinted)}/10000</b>
                </span>{' '}
                HETs have been minted!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="/00.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        <div>
          <img
            alt="Twitter Logo"
            className={styles.twitterLogo}
            src="./twitter.svg"
          />
          {'  '}
          <a
            className={styles.footerText}
            href={TWITTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <b>{`built by @${TWITTER_HANDLE}`}</b>
          </a>
        </div>
      </footer>
    </div>
  );
}
