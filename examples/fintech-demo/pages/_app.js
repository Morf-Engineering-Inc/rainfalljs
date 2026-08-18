import '../styles/globals.css';
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <div className="shell">
      <Header />
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
