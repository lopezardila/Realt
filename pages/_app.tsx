import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import type { AppProps as NextAppProps } from 'next/app';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import {
  ChainSelectConfig,
  Head,
  LanguageInit,
  Layout,
  MantineProviders,
  RealtProvider,
  Web3Providers,
  Websites,
  getConnectors,
  getReadOnlyConnector,
  getWalletConnectV2,
  gnosisHooks,
  gnosisSafe,
  initLanguage,
  metaMask,
  metaMaskHooks,
  parseAllowedChain,
} from '@realtoken/realt-commons';

import axios from 'axios';
import { Provider as JotaiProvider } from 'jotai';

import 'src/i18next';
import { resources } from 'src/i18next';
import InitStoreProvider from 'src/providers/InitStoreProvider';

import { modals } from '../src/components';
import { HeaderNav } from '../src/components/HeaderNav';
import { FooterLinks } from '../src/components/footer/FooterLinks';
import { Banners } from '../src/components/header/Banners';
import { CHAINS, ChainsID, Chain as CustomChain } from '../src/constants';
import { modalStyles, theme } from '../src/theme';

export const i18n = initLanguage(resources);

const customChains: ChainSelectConfig<CustomChain> = {
  allowedChains: parseAllowedChain(ChainsID),
  chainsConfig: CHAINS,
  defaultChainId: ChainsID.Gnosis,
};

const showAllNetworks = true;

const env = process.env.NEXT_PUBLIC_ENV ?? 'development';
const walletConnectKey = process.env.NEXT_PUBLIC_WALLET_CONNECT_KEY ?? '';
// console.log("key: ", walletConnectKey)

const [walletConnectV2, walletConnectV2Hooks] = getWalletConnectV2<CustomChain>(
  customChains,
  env,
  walletConnectKey,
  showAllNetworks
);
const [readOnly, readOnlyHooks] = getReadOnlyConnector(customChains);

const libraryConnectors = getConnectors({
  metamask: [metaMask, metaMaskHooks],
  gnosisSafe: [gnosisSafe, gnosisHooks],
  walletConnectV2: [walletConnectV2, walletConnectV2Hooks],
  readOnly: [readOnly, readOnlyHooks],
});

type AppProps = NextAppProps;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <RealtProvider value={{ env, showAllNetworks }}>
          <Web3Providers libraryConnectors={libraryConnectors}>
            <InitStoreProvider>
              <MantineProviders
                modals={modals}
                modalStyles={modalStyles}
                theme={theme}
                notificationsProps={{
                  position: 'bottom-right',
                }}
              >
                <LanguageInit i={i18n} />
                <Layout
                  currentWebsite={Websites.YAM}
                  chains={customChains}
                  head={
                    <Head
                      title='Realtoken YAM (You And Me)'
                      description='Realtoken YAM (You And Me)'
                    />
                  }
                  headerNav={<HeaderNav />}
                  footerCustomLinks={<FooterLinks />}
                  headerBanner={<Banners />}
                >
                  <ReactQueryDevtools />
                  <Component {...pageProps} />
                </Layout>
              </MantineProviders>
            </InitStoreProvider>
          </Web3Providers>
        </RealtProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};

export default App;
