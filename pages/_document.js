import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="mn">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Дэлхийн мэдээг бизнес боломж болгон хувиргадаг AI тагнуул" />
        <meta name="theme-color" content="#0a0a0c" />
        <meta property="og:title" content="Opportunity Radar" />
        <meta property="og:description" content="Дэлхийн мэдээг бизнес боломж болгон хувиргадаг AI тагнуул" />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
