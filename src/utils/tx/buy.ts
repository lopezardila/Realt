import { showNotification, updateNotification } from "@mantine/notifications";
import BigNumber from "bignumber.js";
import { Chain, ContractsID, NOTIFICATIONS, NotificationsID, TypedContract } from 'src/constants';
import coinBridgeTokenPermitSignature from "../../hooks/coinBridgeTokenPermitSignature";
import erc20PermitSignature from "../../hooks/erc20PermitSignature";
import { Web3Provider } from "@ethersproject/providers";
import { CoinBridgeToken, coinBridgeTokenABI } from "../../abis";
import { Offer } from "../../types/offer";
import { getContract } from "../getContract";
import { AvailableConnectors, ConnectorsDatas } from "@realtoken/realt-commons";

export enum BUY_METHODS{
  buyWithApprove = "buyWithApprove",
  buyWithPermit = "buyWithPermit"
}

export const approve = async (

) => {
  try{

    

  }catch(err){
    console.error(err);
  }
}

export const buy = async (
    account: string|undefined,
    provider: Web3Provider|undefined,
    activeChain: Chain|undefined,
    realTokenYamUpgradeable: TypedContract<ContractsID>|undefined,
    offer: Offer,
    amount: number,
    connector: string,
    setSubmitting: (state: boolean) => void,
    onFinished?: () => void,
    method?: string
) => {
      try {
        if (
          !account ||
          !provider ||
          !amount ||
          !realTokenYamUpgradeable
        ){
          return;
        }

        const buyMethod = method ?? BUY_METHODS.buyWithApprove;
        // console.log("buyMethod: ", buyMethod)

        const price = parseFloat(offer.price);

        const amountInWei = new BigNumber(parseInt(new BigNumber(amount.toString()).shiftedBy(Number(offer.offerTokenDecimals)).toString()));
        const priceInWei = new BigNumber(price.toString()).shiftedBy(Number(offer.buyerTokenDecimals));

        // console.log("amountInWei: ", amountInWei.toString())
        // console.log("priceInWei: ", priceInWei.toString())

        const buyerToken = getContract<CoinBridgeToken>(
            offer.buyerTokenAddress,
            coinBridgeTokenABI,
            provider as Web3Provider,
            account
        );

        if(!buyerToken){
          console.error("buyerToken is undefined");
          return;
        };

        const buyerTokenAmount = new BigNumber(parseInt(amountInWei.multipliedBy(priceInWei).shiftedBy(-offer.offerTokenDecimals).toString()));
        const transactionDeadline = Math.floor(Date.now() / 1000) + 3600; // permit valable during 1h

        console.log("buyerTokenAmount: ", buyerTokenAmount.toString())

        let approveNeeded = false;
        if(buyMethod == BUY_METHODS.buyWithApprove){
          const allowance = await buyerToken.allowance(account, realTokenYamUpgradeable.address);
          console.log("allowance: ", allowance.toString());
          if(allowance.lt(buyerTokenAmount.toString(10))){
            approveNeeded = true;
          }
        }

        console.log("approveNeeded: ", approveNeeded)

        const buyerTokenType = await realTokenYamUpgradeable.getTokenType(
          offer.buyerTokenAddress
        );

        if(
          connector == ConnectorsDatas.get(AvailableConnectors.gnosisSafe)?.connectorKey || 
          connector == ConnectorsDatas.get(AvailableConnectors.walletConnectV2)?.connectorKey || 
          buyMethod == BUY_METHODS.buyWithApprove
        ){

          if(approveNeeded){
            // TokenType = 3: ERC20 Without Permit, do Approve/buy
            const approveTx = await buyerToken.approve(
              realTokenYamUpgradeable.address,
              buyerTokenAmount.toString(10)
            );

            const notificationApprove = {
              key: approveTx.hash,
              href: `${activeChain?.blockExplorerUrl}tx/${approveTx.hash}`,
              hash: approveTx.hash,
            };

            showNotification(
              NOTIFICATIONS[NotificationsID.approveOfferLoading](
                notificationApprove
              )
            );

            approveTx
              .wait()
              .then(({ status }) =>
                updateNotification(
                  NOTIFICATIONS[
                    status === 1
                      ? NotificationsID.approveOfferSuccess
                      : NotificationsID.approveOfferError
                  ](notificationApprove)
                )
              );

            await approveTx.wait(1);
          }

          const buyTx = await realTokenYamUpgradeable.buy(
            offer.offerId,
            priceInWei.toString(),
            amountInWei.toString()
          );

          const notificationBuy = {
            key: buyTx.hash,
            href: `${activeChain?.blockExplorerUrl}tx/${buyTx.hash}`,
            hash: buyTx.hash,
          };

          showNotification(
            NOTIFICATIONS[NotificationsID.buyOfferLoading](notificationBuy)
          );

          buyTx
            .wait()
            .then(({ status }) =>
              updateNotification(
                NOTIFICATIONS[
                  status === 1
                    ? NotificationsID.buyOfferSuccess
                    : NotificationsID.buyOfferError
                ](notificationBuy)
              )
            );
            

        }else{
          if (buyerTokenType === 1) {
            // TokenType = 1: RealToken
  
            const { r, s, v }: any = await coinBridgeTokenPermitSignature(
              account,
              realTokenYamUpgradeable.address,
              buyerTokenAmount.toString(),
              transactionDeadline,
              buyerToken,
              provider
            );
  
            const tx = await realTokenYamUpgradeable.buyWithPermit(
              offer.offerId,
              priceInWei.toString(),
              amountInWei.toString(),
              transactionDeadline.toString(),
              v,
              r,
              s
            );
            
            const notificationPayload = {
              key: tx.hash,
              href: `${activeChain?.blockExplorerUrl}tx/${tx.hash}`,
              hash: tx.hash,
            };
  
            showNotification(
              NOTIFICATIONS[NotificationsID.buyOfferLoading](notificationPayload)
            );
  
            tx
              .wait()
              .then(({ status }) =>
                updateNotification(
                  NOTIFICATIONS[
                    status === 1
                      ? NotificationsID.buyOfferSuccess
                      : NotificationsID.buyOfferError
                  ](notificationPayload)
                )
              );
          } else if (buyerTokenType === 2) {
            // TokenType = 2: ERC20 With Permit
            const { r, s, v }: any = await erc20PermitSignature(
              account,
              realTokenYamUpgradeable.address,
              buyerTokenAmount.toString(),
              transactionDeadline,
              buyerToken,
              provider
            );
  
            const buyWithPermitTx = await realTokenYamUpgradeable.buyWithPermit(
              offer.offerId,
              priceInWei.toString(),
              amountInWei.toString(),
              transactionDeadline.toString(),
              v,
              r,
              s
            );
  
            const notificationPayload = {
              key: buyWithPermitTx.hash,
              href: `${activeChain?.blockExplorerUrl}tx/${buyWithPermitTx.hash}`,
              hash: buyWithPermitTx.hash,
            };
  
            showNotification(
              NOTIFICATIONS[NotificationsID.buyOfferLoading](notificationPayload)
            );
  
            buyWithPermitTx
              .wait()
              .then(({ status }) =>
                updateNotification(
                  NOTIFICATIONS[
                    status === 1
                      ? NotificationsID.buyOfferSuccess
                      : NotificationsID.buyOfferError
                  ](notificationPayload)
                )
              );
          } else if (buyerTokenType === 3) {

            // TokenType = 3: ERC20 Without Permit, do Approve/buy

          
            if(approveNeeded){


              const approveTx = await buyerToken.approve(
                realTokenYamUpgradeable.address,
                buyerTokenAmount.toString()
              );
    
              const notificationApprove = {
                key: approveTx.hash,
                href: `${activeChain?.blockExplorerUrl}tx/${approveTx.hash}`,
                hash: approveTx.hash,
              };
    
              showNotification(
                NOTIFICATIONS[NotificationsID.approveOfferLoading](
                  notificationApprove
                )
              );
    
              approveTx
                .wait()
                .then(({ status }) =>
                  updateNotification(
                    NOTIFICATIONS[
                      status === 1
                        ? NotificationsID.approveOfferSuccess
                        : NotificationsID.approveOfferError
                    ](notificationApprove)
                  )
                );
    
              await approveTx.wait(1);

            }
  
            const buyTx = await realTokenYamUpgradeable.buy(
              offer.offerId,
              priceInWei.toString(),
              amountInWei.toString()
            );
  
            const notificationBuy = {
              key: buyTx.hash,
              href: `${activeChain?.blockExplorerUrl}tx/${buyTx.hash}`,
              hash: buyTx.hash,
            };
  
            showNotification(
              NOTIFICATIONS[NotificationsID.buyOfferLoading](notificationBuy)
            );
  
            buyTx
              .wait()
              .then(({ status }) =>
                updateNotification(
                  NOTIFICATIONS[
                    status === 1
                      ? NotificationsID.buyOfferSuccess
                      : NotificationsID.buyOfferError
                  ](notificationBuy)
                )
              );
          } else {
            console.log('Token is not whitelisted');
            showNotification(NOTIFICATIONS[NotificationsID.buyOfferInvalid]());
          }
        }

        if(onFinished) onFinished();

      } catch (e) {
        console.error('Error in BuyModalWithPermit', e);
        showNotification(NOTIFICATIONS[NotificationsID.buyOfferInvalid]());
        setSubmitting(false);
      }
}