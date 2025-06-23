import Head from 'next/head';
import Home from '@/components/Home'; // Adjusted path based on your src structure
import data from '../../data.json'; // Adjusted path to access data.json from root
import { Geist, Geist_Mono } from 'next/font/google';
import styles from '@/styles/Home.module.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function Index() {
  return (
    <>
      <Head>
        <title>MLB Betting Odds</title>
        <meta name="description" content="MLB Betting Odds Table" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          <h1 className={styles.title}>MLB Betting Odds</h1>
          <Home data={data.data} />
        </main>
      </div>
    </>
  );
}