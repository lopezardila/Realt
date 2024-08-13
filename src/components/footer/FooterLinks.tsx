import { useTranslation } from 'react-i18next';

import { useRouter } from 'next/router';

import { Flex, Text } from '@mantine/core';

import classes from './FooterLinks.module.css';

export const FooterLinks = () => {
  const { t } = useTranslation('links');
  const router = useRouter();

  return (
    <Flex>
      <Text
        size={'sm'}
        fw={700}
        onClick={() => router.push('/faq')}
        className={classes.link}
      >
        {t('footer.faq')}
      </Text>
    </Flex>
  );
};
