import { AppProps } from 'next/app';
import MUIProvider from '../components/MUIProvider';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MUIProvider>
      <Component {...pageProps} />
    </MUIProvider>
  );
}

export default MyApp;
