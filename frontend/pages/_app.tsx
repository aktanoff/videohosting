import "../styles/globals.css";
import React from "react";
import Footer from "../components/general/footer";
import Header from "../components/general/header";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core";
import { getMyInfo } from "../api/user";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { WSURL } from "../api/config";
import GlobalStore from "../mobx/GlobalStore";
import { AppProps } from "next/app";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  main: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(2),
  },
}));

function MyApp({
  Component,
  pageProps,
  pathname,
}: AppProps & { pathname: string }) {
  const classes = useStyles();

  async function load() {
    let myInfo;
    try {
      myInfo = (await getMyInfo()).data;
    } catch (e) {
      console.error(e);
    }
    console.log(myInfo);

    if (!myInfo) {
      return;
    }

    // С этого места мы авторизованы

    const ws = new WebSocket(WSURL);

    ws.onclose = () => {
      console.log("Мы отключились от WS");
    };

    ws.onerror = (err) => {
      console.log(err);
    };

    GlobalStore.setAuthorized(true);
    GlobalStore.setAvatar(myInfo.avatar);
    GlobalStore.setFirstName(myInfo.firstName);
    GlobalStore.setSecondName(myInfo.secondName);
    GlobalStore.setId(myInfo.id);
    GlobalStore.setEmail(myInfo.email);
    GlobalStore.setWs(ws);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Container maxWidth="lg" className={classes.root}>
      <main className={classes.main}>
        <Header
          pathname={pathname}
          menuItems={
            GlobalStore.authorized
              ? [
                  { title: "Список видео", url: "/videos" },
                  { title: "Понравившиеся", url: "/favourites" },
                  {
                    title: `Профиль (${GlobalStore.getFullName})`,
                    url: "/profile",
                  },
                  { title: "Выйти", url: "/api/user/logout" },
                ]
              : []
          }
          authorized={GlobalStore.authorized}
        />
        <Component {...pageProps} />
      </main>
      <Footer />
    </Container>
  );
}

MyApp.getInitialProps = async ({ Component, ctx }) => {
  const { pathname } = ctx;

  let pageProps = {};
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  return { pageProps, pathname };
};

export default observer(MyApp);
