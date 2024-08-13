import { useWeb3React } from '@web3-react/core';

import {
  ethereumAllowedTokens,
  gnosisAllowedTokens,
  goerliAllowedTokens,
} from 'src/constants/allowedBuyTokens';
import { AllowedToken } from 'src/types/allowedTokens';

type useAllowedBuyTokensReturn = {
  allowedTokens: AllowedToken[];
};

export const getRightAllowBuyTokens = (
  chainId: number | undefined
): AllowedToken[] => {
  switch (chainId) {
    case 1:
      return ethereumAllowedTokens;
    case 5:
      return goerliAllowedTokens ;
    case 100:
      return gnosisAllowedTokens;
    default:
      return [];
  }
};

export const useAllowedTokens = (): useAllowedBuyTokensReturn => {
  const { chainId } = useWeb3React();
  return {
    allowedTokens: getRightAllowBuyTokens(chainId),
  };
};
