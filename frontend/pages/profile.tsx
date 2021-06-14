import React, { ReactElement } from "react";
import { Box, Button, Grid, makeStyles, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { getMyVideos, updateVideo, uploadVideo } from "../api/video";
import GlobalStore from "../mobx/GlobalStore";
import LinearProgress from "@material-ui/core/LinearProgress";
import theme from "../components/theme";
import PublishIcon from "@material-ui/icons/Publish";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import Head from "next/head";
import VideoEntity from "../components/pages/profile/videoEntity";
import ProfileVideo from "../types/profileVideo";

const useStyles = makeStyles({
  container: {
    width: "100%",
    background: theme.palette.grey[100],
    padding: "10px",
    borderRadius: "10px",
  },
  secondContainer: {
    width: "100%",
    background: theme.palette.grey[200],
    padding: "30px",
    borderRadius: "10px",
  },
  profile: {
    textAlign: "center",
    "& img": {
      maxWidth: "160px",
      width: "100%",
      margin: "0 auto",
      transform: "translate3d(0, -50%, 0)",
    },
  },
  name: {
    marginTop: "-80px",
    paddingBottom: "30px",
  },
  title: {
    display: "inline-block",
    position: "relative",
    marginTop: "10px",
    minHeight: "32px",
    textDecoration: "none",
  },
  avatar: {
    overflow: "hidden",
    borderRadius: "50%",
  },
  h6: {
    margin: 0,
  },
});

function ProfilePage(): ReactElement {
  const classes = useStyles();

  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [uploadPercent, setUploadPercent] = useState<number | undefined>();

  const [myVideos, setMyVideos] = useState<Array<ProfileVideo> | undefined>();

  useEffect(() => {
    getMyVideos()
      .then(({ data }) => {
        setMyVideos(data.map((video) => ({ ...video, editing: false })));
      })
      .catch((e) => {
        console.log("Ошибка загрузки видео", e);
      });
  }, []);

  const fileInputRef = useRef<HTMLInputElement>();

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmission = async () => {
    const formData = new FormData();

    if (!selectedFile) {
      return;
    }

    formData.append("video", selectedFile);

    const { data } = await uploadVideo(formData, (progressEvent) =>
      setUploadPercent(
        Math.min((progressEvent.loaded / selectedFile.size) * 100, 100)
      )
    );
    data.editing = true;

    setMyVideos([data, ...myVideos]);

    setSelectedFile(undefined);
    setUploadPercent(undefined);

    if (fileInputRef.current !== undefined) {
      fileInputRef.current.value = null;
    }
  };

  function toggleEditing(videoId: number): void {
    setMyVideos(
      myVideos.map((video) => ({
        ...video,
        editing: video.id === videoId ? !video.editing : video.editing,
      }))
    );
  }

  const [loadingInfoMap, setLoadingInfoMap] = useState(new Map());
  function getLoadingInfoString(
    videoId: number,
    quality: number | string
  ): string {
    return `${videoId} ${quality}`;
  }

  useEffect(() => {
    if (!GlobalStore.ws) {
      return;
    }

    function addAvailableQualities(videoId, quality) {
      setMyVideos((videos) =>
        videos.map((video) => ({
          ...video,
          availableQualities:
            video.id === videoId
              ? [...video.availableQualities, quality]
              : video.availableQualities,
        }))
      );
    }

    function handler(event) {
      const message = JSON.parse(event.data);

      if (message.event === "videoProgress") {
        const { videoId, profileHeight, progress } = message.data;

        if (progress.percent && Number.isFinite(progress.percent)) {
          loadingInfoMap.set(
            getLoadingInfoString(videoId, profileHeight),
            progress.percent
          );
          setLoadingInfoMap(new Map(loadingInfoMap));
        }
      } else if (message.event === "videoEnd") {
        const { videoId, profileHeight } = message.data;
        loadingInfoMap.delete(getLoadingInfoString(videoId, profileHeight));
        setLoadingInfoMap(new Map(loadingInfoMap));

        addAvailableQualities(videoId, profileHeight.toString());
      }
    }

    GlobalStore.ws.addEventListener("message", handler);

    return () => {
      GlobalStore.ws.removeEventListener("message", handler);
    };
  }, [loadingInfoMap, myVideos]);

  function changeName(videoId: number, name: string): void {
    setMyVideos(
      myVideos.map((video) => ({
        ...video,
        name: video.id === videoId ? name : video.name,
      }))
    );
  }

  async function saveVideo(videoId: number): Promise<void> {
    let hasErrors = false;

    setMyVideos(
      myVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        let nameError;

        if (video.name === "") {
          nameError = "Заполните обязательное поле";
          hasErrors = true;
        } else {
          nameError = "";
        }

        return {
          ...video,
          nameError,
        };
      })
    );

    if (hasErrors) {
      return;
    }

    const video = myVideos.find((video) => video.id === videoId);

    await updateVideo(videoId, video.name, video.activePreview);

    toggleEditing(videoId);
  }

  function changeActivePreview(videoId: number, i: number): void {
    setMyVideos(
      myVideos.map((video) => ({
        ...video,
        activePreview: video.id === videoId ? i : video.activePreview,
      }))
    );
  }

  return (
    <Box display="flex" flexDirection="column">
      <Head>
        <title>Мой профиль - VideoHosting</title>
      </Head>
      <Box margin={"100px 10px 0"} display="flex" className={classes.container}>
        <Grid container justify="center">
          <Grid item xs={12} sm={12} md={6}>
            <div className={classes.profile}>
              <div>
                <img
                  src={GlobalStore.avatar}
                  alt="..."
                  className={classes.avatar}
                />
              </div>
              <div className={classes.name}>
                <h3 className={classes.title}>{GlobalStore.getFullName}</h3>
                <h6 className={classes.h6}>{GlobalStore.email}</h6>
              </div>
            </div>
          </Grid>
          <div>
            <Typography variant="h5" gutterBottom component="div">
              Загрузка видео
            </Typography>
            <br />
            <input
              id="contained-button-file"
              type="file"
              name="file"
              onChange={changeHandler}
              accept=".mp4, .avi, .webm"
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <label htmlFor="contained-button-file">
              <Button
                variant="contained"
                component="span"
                startIcon={<AttachFileIcon />}
              >
                {selectedFile
                  ? "Изменить прикрепленное видео"
                  : "Прикрепить видеофайл"}
              </Button>
            </label>
            {selectedFile ? (
              <div>
                <p>Название видеофайла: {selectedFile.name}</p>
                <p>Размер в байтах: {selectedFile.size}</p>
                {uploadPercent ? (
                  <>
                    <Box display="flex" alignItems="center">
                      <Box width="100%" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={uploadPercent}
                        />
                      </Box>
                      <Box minWidth={35}>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                        >{`${Math.round(uploadPercent)}%`}</Typography>
                      </Box>
                    </Box>

                    {Math.round(uploadPercent) === 100 && (
                      <Box marginBottom={"10px"}>
                        <Alert severity="success" color="info">
                          Видео загружено, ждём ответа от сервера.
                        </Alert>
                      </Box>
                    )}
                  </>
                ) : (
                  <br />
                )}
              </div>
            ) : (
              <p>Пожалуйста, выберите файл</p>
            )}
            {selectedFile && (
              <div>
                {!uploadPercent && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PublishIcon />}
                    onClick={handleSubmission}
                  >
                    Загрузить
                  </Button>
                )}
              </div>
            )}
          </div>
        </Grid>
      </Box>

      <Box className={classes.secondContainer} margin={"50px 10px 0"}>
        {!myVideos
          ? "Загрузка..."
          : !myVideos.length
          ? "Загруженные вами видео отсутствуют."
          : myVideos.map((video) => (
              <VideoEntity
                key={video.id}
                video={video}
                toggleEditing={toggleEditing}
                saveVideo={saveVideo}
                changeName={changeName}
                changeActivePreview={changeActivePreview}
                getLoadingInfoString={getLoadingInfoString}
                loadingInfoMap={loadingInfoMap}
              />
            ))}
      </Box>
    </Box>
  );
}

export default observer(ProfilePage);
