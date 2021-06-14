import React, { ReactElement, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  Dialog,
  DialogActions,
  DialogTitle,
  makeStyles,
  Paper,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import CheckIcon from "@material-ui/icons/Check";

import LinearProgress from "@material-ui/core/LinearProgress";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import { Delete } from "@material-ui/icons";
import { useRouter } from "next/router";
import { deleteVideo } from "../../../api/video";
import ProfileVideo from "../../../types/profileVideo";

const useStyles = makeStyles({
  video: {
    "&:not(:first-child)": {
      marginTop: "40px",
    },
    padding: "20px 30px",
  },

  rightButton: {
    display: "flex",
    marginLeft: "auto",
    paddingLeft: "30px",

    "& > *": {
      margin: "0 8px",
    },
  },
  toolbar: {
    marginTop: "30px",
    justifyContent: "space-between",
    flexWrap: "wrap",
    "& > *": {
      margin: "5px",
    },
  },
  media: {
    height: 118,
    width: 210,
  },
  inActive: {
    opacity: 0.3,
  },
});

function VideoEntity({
  video,
  changeName,
  saveVideo,
  toggleEditing,
  changeActivePreview,
  getLoadingInfoString,
  loadingInfoMap,
}: {
  video: ProfileVideo;
  changeName: (videoId: number, name: string) => void;
  saveVideo: (videoId: number) => Promise<void>;
  toggleEditing: (videoId: number) => void;
  changeActivePreview: (videoId: number, i: number) => void;
  getLoadingInfoString: (videoId: number, quality: number | string) => string;
  loadingInfoMap: Map<string, number>;
}): ReactElement {
  const classes = useStyles();

  const router = useRouter();

  const qualitiesSet = new Set(video.qualities);
  const availableQualitiesSet = new Set(video.availableQualities);

  const unpreparedQualities = Array.from(qualitiesSet).filter(
    (x) => !availableQualitiesSet.has(x)
  );

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  function deleteConfirmCloseHandler() {
    setDeleteConfirmationOpen(false);
  }

  function deleteConfirmOpenHandler() {
    setDeleteConfirmationOpen(true);
  }

  const [alertText, setAlertText] = useState("");

  function alertTextSetHandler(text: string) {
    setAlertText(text);
  }

  function errorAlertCloseHandler() {
    setAlertText("");
  }

  return (
    <Paper elevation={2} className={classes.video}>
      <Box display="flex" alignItems="center">
        <Snackbar
          open={Boolean(alertText)}
          autoHideDuration={6000}
          onClose={errorAlertCloseHandler}
        >
          <Alert onClose={errorAlertCloseHandler} severity="error">
            {alertText}
          </Alert>
        </Snackbar>

        {video.editing ? (
          <TextField
            label="Название видео"
            variant="outlined"
            value={video.name}
            onChange={(e) => {
              changeName(video.id, e.target.value);
            }}
            error={!!video.nameError}
            helperText={video.nameError}
            fullWidth
          />
        ) : video.name === "" ? (
          <Alert severity="error">
            Введите, пожалуйста, название для публикации видео.
          </Alert>
        ) : (
          <Typography variant="h5" gutterBottom>
            {video.name}
          </Typography>
        )}

        <Typography align="right" className={classes.rightButton}>
          {video.editing ? (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SaveIcon />}
              onClick={() => saveVideo(video.id)}
            >
              Сохранить
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => toggleEditing(video.id)}
            >
              Редактировать
            </Button>
          )}

          <Button
            variant="contained"
            color="secondary"
            startIcon={<Delete />}
            onClick={deleteConfirmOpenHandler}
          >
            Удалить
          </Button>
          <Dialog
            open={deleteConfirmationOpen}
            onClose={deleteConfirmCloseHandler}
          >
            <DialogTitle>Вы точно хотите удалить данное видео?</DialogTitle>
            <DialogActions>
              <Button
                autoFocus
                onClick={deleteConfirmCloseHandler}
                color="primary"
              >
                Нет
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await deleteVideo(video.id).then(() => {
                      router.reload();
                    });
                  } catch (e) {
                    if (e?.response?.data?.error) {
                      alertTextSetHandler(e?.response?.data?.error);
                    } else {
                      alertTextSetHandler("Возникла непредвиденная ошибка");
                    }
                  }

                  deleteConfirmCloseHandler();
                }}
                color="secondary"
                autoFocus
              >
                Да
              </Button>
            </DialogActions>
          </Dialog>
        </Typography>
      </Box>

      <Toolbar component="nav" variant="dense" className={classes.toolbar}>
        {video.previews.map((preview, i) => (
          <Card key={preview}>
            <CardActionArea
              onClick={() => {
                if (video.editing) {
                  changeActivePreview(video.id, i);
                }
              }}
              disabled={!video.editing}
            >
              <CardMedia
                image={preview}
                title={`Превью ${i}`}
                className={`${classes.media} ${
                  video.activePreview === i ? "" : classes.inActive
                }`}
              />
            </CardActionArea>
          </Card>
        ))}
      </Toolbar>

      {unpreparedQualities.length === 0 && (
        <Alert
          icon={<CheckIcon fontSize="inherit" />}
          severity="success"
          style={{ marginTop: "25px" }}
        >
          Все видеозаписи прошли стадию обработки
        </Alert>
      )}

      {unpreparedQualities.map((quality) =>
        loadingInfoMap.has(getLoadingInfoString(video.id, quality)) ? (
          <Box
            display="flex"
            alignItems="center"
            marginTop={"30px"}
            key={quality}
          >
            <Box minWidth={45}>
              <Typography variant="body2" color="textSecondary">
                {quality}p
              </Typography>
            </Box>
            <Box width="100%" mr={1}>
              <LinearProgress
                variant="determinate"
                value={loadingInfoMap.get(
                  getLoadingInfoString(video.id, quality)
                )}
              />
            </Box>
            <Box minWidth={35}>
              <Typography variant="body2" color="textSecondary">{`${
                Math.round(
                  loadingInfoMap.get(getLoadingInfoString(video.id, quality)) *
                    10
                ) / 10
              }%`}</Typography>
            </Box>
          </Box>
        ) : (
          ""
        )
      )}
    </Paper>
  );
}

export default VideoEntity;
