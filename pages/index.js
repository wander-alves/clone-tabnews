/* eslint-disable @next/next/no-img-element */
/*eslint-disable react/no-unescaped-entities*/

export default function Home() {
  return (
    <main>
      <div className="content-container">
        <img src="/marvin-without-background.png" alt="Marvin" />
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
  );
}
