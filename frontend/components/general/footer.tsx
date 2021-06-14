import React, { ReactElement } from "react";
import { Box, makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  footer: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(3, 2),
    marginTop: "auto",
  },
  main: {
    flex: 1,
  },
}));

function Footer(): ReactElement {
  const classes = useStyles();

  return (
    <Box display="flex" className={classes.footer}>
      <Typography align="right" className={classes.main}>
        © 2021 VideoHosting
      </Typography>
    </Box>
  );
}

export default Footer;
