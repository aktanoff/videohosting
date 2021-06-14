import React, { ReactElement } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Grid,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFavouriteVideos } from "../api/video";
import Video from "../types/video";
import Head from "next/head";

const useStyles = makeStyles({
  root: {
    maxWidth: 345,
  },
  media: {
    height: 135,
  },
  name: {
    padding: "3px 10px",
  },
});

export default function FavouritesPage(): ReactElement {
  const classes = useStyles();

  const [videos, setVideos] = useState<undefined | Video[]>();
  async function load() {
    try {
      const videosReq = await getFavouriteVideos();

      if (!videosReq.data) {
        return;
      }

      setVideos(videosReq.data);
    } catch (e) {
      console.log("Ошибка загрузки видео", e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Box margin={"30px 10px"}>
      <Head>
        <title>Понравившиеся видео - VideoHosting</title>
      </Head>
      {!videos ? (
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress />
        </Box>
      ) : !videos.length ? (
        "Видеозаписи отсутствуют."
      ) : (
        <Grid container spacing={10}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={3} key={video.id}>
              <Card className={classes.root}>
                <Link href={`/videos/${video.id}`} passHref>
                  <CardActionArea>
                    <CardMedia
                      image={video.previews[video.activePreview]}
                      title={video.name}
                      className={classes.media}
                    />
                    <CardContent className={classes.name}>
                      <Typography variant="h6" component="h4">
                        {video.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Link>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
