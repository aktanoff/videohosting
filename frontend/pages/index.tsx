import { Box, Button, Typography } from "@material-ui/core";
import { observer } from "mobx-react";
import Link from "next/link";
import Head from "next/head";
import React, { ReactElement } from "react";
import GlobalStore from "../mobx/GlobalStore";

function HomePage(): ReactElement {
  return (
    <Box margin={"30px 10px"}>
      <Head>
        <title>Главная - VideoHosting</title>
      </Head>
      <Typography component="h4" variant="h4" color="inherit" noWrap>
        Добро пожаловать
      </Typography>
      Данный сервис является дипломной работой. <br />
      Основной функционал заключается в возможности загрузки видеофайлов и их
      просмотре при помощи браузера.
      <br />
      {!GlobalStore.authorized &&
        "Для того чтобы использовать его функционал, пожалуйста, войдите через гугл по кнопке в правом верхнем углу."}
      {GlobalStore.authorized && (
        <>
          <Box marginTop={"20px"}>
            Если вы хотите посмотреть видео, то воспользуйтесь страницами{" "}
            <Link href="/videos" passHref>
              <Button size="small" color="primary">
                Список видео
              </Button>
            </Link>{" "}
            или{" "}
            <Link href="/favourites" passHref>
              <Button size="small" color="primary">
                Понравившиеся
              </Button>
            </Link>
          </Box>

          <Box marginTop={"20px"}>
            Если вы хотите загрузить видео на площадку то воспользуйтесь
            страницей{" "}
            <Link href="/profile" passHref>
              <Button size="small" color="primary">
                Профиля ({GlobalStore.getFullName})
              </Button>
            </Link>
          </Box>
        </>
      )}
    </Box>
  );
}

export default observer(HomePage);
