import "@mantine/core/styles.css";
import AOS from "aos";
import "aos/dist/aos.css";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import { theme } from "../theme";
import { useEffect } from "react";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/carousel/styles.css";

export default function App({ Component, pageProps }: any) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 50,
      delay: 0,
      once: false,
    });
  }, []);
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <Head>
        <title>Mantine Template</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="shortcut icon" href="/favicon.svg" />
      </Head>
      <Component {...pageProps} />
    </MantineProvider>
  );
}
