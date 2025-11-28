/*eslint-disable react/no-unescaped-entities*/
import Head from "next/head";
import Image from "next/image";

import "./style.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>My place on the universe</title>
      </Head>
      <main>
        <div className="content-container">
          <Image src="/marvin-without-background.png" alt="Marvin" />
          <div>
            <h1>
              Life! <br /> Don't talk to me about life!
            </h1>
            <em>
              <q>Marvin, the Paranoid Android</q>
            </em>
          </div>
        </div>
      </main>
    </>
  );
}
