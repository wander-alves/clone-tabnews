import Head from "next/head.js";
import "./global.css";

export default function RootLayout({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="description" content= "A page for testing my programming skills."/>
        <title>My place on the universe</title>
      </Head>
      <Component {...pageProps}/>
    </>
  );
}
