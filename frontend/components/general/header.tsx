import {
  Button,
  Link,
  makeStyles,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { OndemandVideo } from "@material-ui/icons";
import NextJSLink from "next/link";
import React, { ReactElement } from "react";
import GoogleIcon from "./GoogleIcon.svg";

const useStyles = makeStyles((theme) => ({
  toolbar: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  toolbarTitle: {
    flexGrow: 1,
  },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    "& > :first-child": {
      marginRight: "6px",
    },
  },
  toolbarSecondary: {
    justifyContent: "space-between",
    overflowX: "auto",
  },
  toolbarLink: {
    padding: theme.spacing(1),
    flexShrink: 0,
  },
}));

function Header(props: {
  authorized: boolean;
  pathname: string;
  menuItems: Array<{ title: string; url: string }>;
}): ReactElement {
  const classes = useStyles();
  const { menuItems = [], pathname, authorized } = props;

  return (
    <React.Fragment>
      <Toolbar className={classes.toolbar}>
        <Typography
          component="h2"
          variant="h5"
          color="inherit"
          align="center"
          noWrap
          className={classes.toolbarTitle}
        >
          <NextJSLink href="/">
            <a className={classes.title}>
              <OndemandVideo />
              VideoHosting
            </a>
          </NextJSLink>
        </Typography>
        {!authorized && (
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <GoogleIcon style={{ maxHeight: "20px", maxWidth: "20px" }} />
            }
            href="/api/user/oauth/google"
          >
            Войти
          </Button>
        )}
      </Toolbar>
      <Toolbar
        component="nav"
        variant="dense"
        className={classes.toolbarSecondary}
      >
        {menuItems.map((section) => (
          <NextJSLink href={section.url} key={section.title} passHref>
            <Link
              underline={section.url === pathname ? "always" : "hover"}
              color="inherit"
              noWrap
              variant="body2"
              className={classes.toolbarLink}
            >
              {section.title}
            </Link>
          </NextJSLink>
        ))}
      </Toolbar>
    </React.Fragment>
  );
}

export default Header;
