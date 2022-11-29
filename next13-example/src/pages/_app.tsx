import { type AppType } from 'next/dist/shared/lib/utils';

import '../styles/globals.css';

const MyApp: AppType = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default MyApp;
