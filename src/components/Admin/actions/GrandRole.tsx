import { useTranslation } from 'react-i18next';

import { Button, Flex, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification, updateNotification } from '@mantine/notifications';

import { utils } from 'ethers';

import { ContractsID, NOTIFICATIONS, NotificationsID } from 'src/constants';
import { useActiveChain, useContract } from 'src/hooks';
import { useRole } from 'src/hooks/useRole';
import { ROLE, USER_ROLE } from 'src/types/admin';
import { calcRem } from 'src/utils/style';

import { Action } from '../Action';

interface GrandRoleForm {
  type: string;
  address: string;
}

export const GrantRole = () => {
  const { t } = useTranslation('admin');

  const { role } = useRole();

  const datas = [
    {
      label: 'Moderator',
      value: ROLE.get(USER_ROLE.MODERATOR) ?? '',
      disabled: false,
    },
    {
      label: 'Administrator',
      value: ROLE.get(USER_ROLE.ADMIN) ?? '',
      disabled: role == USER_ROLE.MODERATOR,
    },
  ];

  const { getInputProps, isValid, onSubmit } = useForm<GrandRoleForm>({
    initialValues: {
      type: ROLE.get(USER_ROLE.MODERATOR) ?? '',
      address: '',
    },
    validate: {
      address: (value) =>
        utils.isAddress(value) && value !== ''
          ? null
          : t('addWL.invalidAddress'),
    },
  });

  const realTokenYamUpgradeable = useContract(
    ContractsID.realTokenYamUpgradeable
  );
  const activeChain = useActiveChain();

  const grantRole = async (formValues: GrandRoleForm) => {
    try {
      if (!realTokenYamUpgradeable) return;

      const grantRoleTx = await realTokenYamUpgradeable.grantRole(
        formValues.type,
        formValues.address
      );

      const notificationGrantRole = {
        key: grantRoleTx.hash,
        href: `${activeChain?.blockExplorerUrl}tx/${grantRoleTx.hash}`,
        hash: grantRoleTx.hash,
      };

      showNotification(
        NOTIFICATIONS[NotificationsID.approveOfferLoading](
          notificationGrantRole
        )
      );

      grantRoleTx
        .wait()
        .then(({ status }) =>
          updateNotification(
            NOTIFICATIONS[
              status === 1
                ? NotificationsID.grantRoleSuccess
                : NotificationsID.grantRoleInvalid
            ](notificationGrantRole)
          )
        );

      await grantRoleTx.wait(1);
    } catch (err) {
      // console.log('Failed to grant role: ', err);
    }
  };

  return (
    <Action title={t('grantRole.title')}>
      <form onSubmit={onSubmit(grantRole)}>
        <Flex gap={'sm'}>
          <Select data={datas} {...getInputProps('type')} />
          <TextInput
            {...getInputProps('address')}
            style={{ width: calcRem(400) }}
          />
          <Button type={'submit'} disabled={!isValid()}>
            {t('grantRole.title')}
          </Button>
        </Flex>
      </form>
    </Action>
  );
};
