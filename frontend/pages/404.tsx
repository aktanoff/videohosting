import React, { ReactElement } from "react";
import { Typography } from "@material-ui/core";

export default function Custom404Page(): ReactElement {
  return (
    <Typography component="h4" variant="subtitle1" color="inherit" noWrap>
      Страница не найдена
    </Typography>
  );
}
