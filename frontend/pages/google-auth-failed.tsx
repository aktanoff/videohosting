import React, { ReactElement } from "react";
import Head from "next/head";
import { Typography } from "@material-ui/core";

export default function GoogleAuthFailedPage(): ReactElement {
  return (
    <Typography component="h4" variant="subtitle1" color="error" noWrap>
      <Head>
        <title>Ошибка аутентификации - VideoHosting</title>
      </Head>
      В процессе аутентификации произошла ошибка
    </Typography>
  );
}
