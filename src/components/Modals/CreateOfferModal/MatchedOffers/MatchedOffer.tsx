import { ActionIcon, Button, Flex, MantineTheme, Text } from "@mantine/core";
import { IconArrowDownLeft, IconArrowUpRight, IconCash, IconExternalLink, IconScale } from "@tabler/icons";
import { useOfferInfos } from "../../../../hooks/useOfferInfos";
import { Offer, OFFER_TYPE } from "../../../../types/offer";
import { OfferTypeBadge } from "../../../Offer/OfferTypeBadge/OfferTypeBadge";
import { OFFER_BEST_TYPE, useMatchedOfferBestType } from "../../../../hooks/useMatchedOfferBestType";
import { buy } from "../../../../utils/tx/buy";
import { useWeb3React } from "@web3-react/core";
import { useActiveChain, useContract } from "../../../../hooks";
import { ContractsID } from "../../../../constants";
import { useAtomValue } from "jotai";
import { providerAtom } from "../../../../states";
import { useState } from "react";
import { openInNewTab } from "../../../../utils/window";
import classes from './MatchedOffer.module.css';

interface MatchedOfferProps{
    offerBestType?: OFFER_BEST_TYPE,
    offer: Offer,
    amount: number|undefined
}
export const MatchedOffer = ({ offerBestType, offer, amount } : MatchedOfferProps) => {

    const { account, provider } = useWeb3React();
    const activeChain = useActiveChain();
    const realTokenYamUpgradeable = useContract(ContractsID.realTokenYamUpgradeable);
    const connector = useAtomValue(providerAtom);

    const { buyerTokenName, offerTokenName } = useOfferInfos(offer);

    const { getOfferBestTypeTranslation } = useMatchedOfferBestType();

    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const buyOffer = () => {
        if(!amount) return;
        try{

            setSubmitting(true);

            const offerAmount = parseFloat(offer.amount);
            const amountToBuy = offerAmount >= amount ? amount : offerAmount;
            
            buy(
                account,
                provider,
                activeChain,
                realTokenYamUpgradeable,
                offer,
                amountToBuy,
                connector,
                setSubmitting,
                () => {
                    setSubmitting(false);
                }
            );

        }catch(err){
            console.log(err);
            setSubmitting(false);
        }
    }

    return(
        <Flex direction={"column"} className={classes.container}>
            <Flex gap={"xs"} direction={"column"} mb={10}>
                { offerBestType ? (
                    <Flex 
                        style={(theme) => ({ 
                            backgroundColor: offerBestType == OFFER_BEST_TYPE.BEST_AMOUNT ? theme.colors.blue : theme.colors.grape,
                            borderRadius: theme.radius.md,
                            fontWeight: 700,
                            padding: `0 ${theme.spacing.sm}px`,
                            color: "white",
                            justifyContent: 'center'
                        })}
                    >
                        {getOfferBestTypeTranslation(offerBestType)}
                    </Flex>
                ): undefined}
                <Flex gap={"xs"}>
                    <div className={classes.offerId}>{offer.offerId}</div>
                    <OfferTypeBadge offerType={offer.type ?? OFFER_TYPE.EXCHANGE} sx={{ flexGrow: 1 }}/>
                    <ActionIcon color={"brand"} onClick={() => openInNewTab(`/offer/${offer.offerId}`)} style={{ height: '40px', width: '2.4rem' }} variant={"outline"}>
                        <IconExternalLink size={24}/>
                    </ActionIcon>
                </Flex>
            </Flex>
            <Flex gap={"sm"} mt={6}>
                <IconArrowUpRight color={"red"} />
                <Text>{buyerTokenName}</Text>
            </Flex>
            <Flex gap={"sm"}>
                <IconArrowDownLeft color={"green"} />
                <Text>{offerTokenName}</Text>
            </Flex>
            <Flex gap={"sm"}>
                <IconCash/>
                <Text>{offer.offerPrice}</Text>
            </Flex>
            <Flex gap={"sm"}>
                <IconScale/>
                <Text>{offer.amount}</Text>
            </Flex>
            <Button 
                className={classes.floatingButton} 
                onClick={() => buyOffer()}
                disabled={!amount}
                loading={isSubmitting}
            >
                {!amount ? "Please provide amount" : "Buy"}
            </Button>
        </Flex>
    )
}