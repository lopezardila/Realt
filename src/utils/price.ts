import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { CHAINS } from '@realtoken/realt-commons';

import BigNumber from 'bignumber.js';

import { oraclePriceFeedABI } from 'src/abis';
import { OraclePriceFeed } from 'src/abis/types/oraclePriceFeed';
import { AllowedToken } from 'src/types/allowedTokens';
import { OFFER_TYPE, Offer } from 'src/types/offer';
import { Price as P } from 'src/types/price';

import { useRootStore } from '../zustandStore/store';
import { chainLink } from './chainlink/chainlink';
import { getContract } from './getContract';

export interface Price {
  contractAddress: string;
  price: string;
}

export const getPrice = (allowedToken: AllowedToken) => {
  return new Promise<Price>(async (resolve, reject) => {
    try {
      const { chainId } = useRootStore.getState();

      const rpcUrl = CHAINS[chainId].rpcUrl;
      const provider = new JsonRpcProvider(rpcUrl);

      const tokenAddress = allowedToken.contractAddress;
      const oracleContractAddress: string | undefined = chainLink.get(
        tokenAddress.toLowerCase()
      );

      if (!oracleContractAddress) {
        resolve({
          contractAddress: tokenAddress,
          price: BigNumber(1).toString(),
        });
        return;
      }

      const oracleContract = getContract<OraclePriceFeed>(
        oracleContractAddress,
        oraclePriceFeedABI,
        provider
      );

      if (!oracleContract) {
        resolve({
          contractAddress: tokenAddress,
          price: BigNumber(1).toString(),
        });
        return;
      }

      const assetPrice = await oracleContract.latestAnswer();
      const assetDecimals = await oracleContract.decimals();
      const tokenPrice = new BigNumber(assetPrice.toString()).shiftedBy(
        -assetDecimals
      );

      resolve({ contractAddress: tokenAddress, price: tokenPrice.toString() });
    } catch (err) {
      // console.log("Error while getting oracle price: ", err);
      reject(err);
    }
  });
};

// if(offer.type == OFFER_TYPE.SELL){
//   const buyTokenPriceInDollar = parseFloat(prices[offer.buyerTokenAddress.toLowerCase()]);
//   return buyTokenPriceInDollar*parseFloat(offer.price);
// }
// if(offer.type == OFFER_TYPE.BUY && offer.officialPrice){
//   return offer.officialPrice;
// }

export const getPriceInDollar = (
  prices: P,
  offer: Offer
): number | undefined => {
  if (offer.type == OFFER_TYPE.SELL) {
    const buyTokenPriceInDollar = parseFloat(
      prices[offer.buyerTokenAddress.toLowerCase()]
    );
    return buyTokenPriceInDollar * parseFloat(offer.price);
  }
  if (offer.type == OFFER_TYPE.BUY && offer.officialPrice) {
    const buyTokenPriceInDollar = 1 / parseFloat(offer.price);
    return buyTokenPriceInDollar;
  }
};

export const getBuyPriceInDollar = (
  prices: P,
  offer: Offer
): number | undefined => {
  return parseFloat(prices[offer.offerTokenAddress.toLowerCase()]);
};
