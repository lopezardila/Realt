import { ActionIcon, Flex, Skeleton, Text } from "@mantine/core"
import { openConfirmModal, useModals } from "@mantine/modals"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCreatedOffer } from "src/hooks/useCreatedOffer"
import { CreatedOffer } from "src/types/offer/CreatedOffer"
import { OfferTypeBadge } from "../Offer/OfferTypeBadge/OfferTypeBadge"
import classes from "./CreateOfferPane.module.css"
import clsx from "clsx"
import { useRootStore } from "../../zustandStore/store"

interface CreateOfferPaneProps{
    isCreating: boolean
    offer?: CreatedOffer
}

export const CreateOfferPane: FC<CreateOfferPaneProps> = ({ isCreating, offer }) => {

    const [hovered,setHovered] = useState<boolean>(false);
    const [removeOffer] = useRootStore(state => [state.removeOffer])

    const modals = useModals();

    const openChooseOfferModal = () => {
        modals.openContextModal('chooseOfferType',{innerProps: {}});
    }

    const modifyCreateOffer = () => {
        modals.openContextModal('createOffer',{innerProps: { offer }});
    }

    const deleteOffer = () => {
        if(offer) removeOffer(offer.offerId)
    }

    const openConfirmDeleteModal = () => openConfirmModal({
        title: 'Are you sure you want to delete this offer ?',
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onConfirm: () => deleteOffer(),
    });

    const { offerTokenSymbol, buyTokenSymbol } = useCreatedOffer(offer);
    const { t } = useTranslation('modals', { keyPrefix: 'sell' });
    
    return(
        <>
        {
            isCreating ? (
                <Flex 
                    className={clsx(classes.offerContainer, classes.createOffer)} 
                    gap={"sm"}
                    onClick={() => openChooseOfferModal()}
                    p={"sm"}
                >
                    <IconPlus />
                    {t('buttonCreateOffer')}
                </Flex>
            )
            : offer ?
            (
                <Flex 
                    className={clsx(classes.offerContainer, classes.offerCreated)} 
                    direction={"column"}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {   hovered ? (
                            <div className={classes.offerActions}>
                                <ActionIcon
                                    color={'green'}
                                    onClick={() => modifyCreateOffer() }
                                >
                                    <IconEdit size={16} aria-label={'Buy'} />
                                </ActionIcon>
                                <ActionIcon
                                    color={'red'}
                                    onClick={() => openConfirmDeleteModal()}
                                >
                                    <IconTrash size={16} aria-label={'Buy'} />
                                </ActionIcon>
                            </div> 
                        ): undefined 
                    }
                    <Flex direction={"column"} p={"sm"} align={"start"}>
                        <OfferTypeBadge offerType={offer.offerType}/>
                        <Text fw={700}>{offerTokenSymbol ? offerTokenSymbol : <Skeleton height={35} width={"100%"}/>}</Text>
                        <Text fs={"italic"} fw={500} color={"gray"}>{buyTokenSymbol ? buyTokenSymbol : <Skeleton height={35} width={"100%"}/>}</Text>
                    </Flex>
                </Flex>
            )
            : 
            undefined
        }
        </>
    )
}