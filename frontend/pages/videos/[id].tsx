import React, { ReactElement, useCallback } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  Link,
  makeStyles,
  Paper,
  TextareaAutosize,
  Typography,
} from "@material-ui/core";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { addComment, getVideo, toggleLike } from "../../api/video";
import VideoPlayer from "../../components/videoPlayer";
import { useRouter } from "next/router";
import theme from "../../components/theme";
import Video from "../../types/video";
import User from "../../types/user";
import { ToggleButton } from "@material-ui/lab";
import { observer } from "mobx-react";
import GlobalStore from "../../mobx/GlobalStore";
import ThumbUpAltIcon from "@material-ui/icons/ThumbUpAlt";
import SendIcon from "@material-ui/icons/Send";
import Comment from "../../types/comment";
import Head from "next/head";

const useStyles = makeStyles({
  main: {
    marginTop: 20,
    width: "100%",
  },
  paperRoot: {
    background: "#000",
    height: "682px",
  },
  largeAvatar: {
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  smallAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  author: {
    marginTop: "20px",
  },
  authorName: {
    paddingLeft: "20px",
  },
  like: {
    flexGrow: 1,
    "& svg": {
      marginLeft: "12px",
    },
  },
  container: {
    marginBottom: "10px",
    width: "100%",
    background: theme.palette.grey[100],
    padding: "10px",
    borderRadius: "10px",
  },
  secondContainer: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
    background: theme.palette.grey[200],
    padding: "10px",
    borderRadius: "10px",
  },
  textArea: {
    boxSizing: "border-box",
    marginRight: "20px",
    width: "100%",
    "& > textarea": {
      padding: "4px",
      boxSizing: "border-box",
      borderRadius: "6px",
      width: "100%",
      resize: "none",
    },
  },
});

function VideoPage(): ReactElement {
  const classes = useStyles();

  const router = useRouter();
  const { id: videoId } = router.query;

  const [video, setVideo] = useState<Video | undefined>();

  const load = useCallback(
    async function () {
      try {
        if (!videoId || typeof videoId !== "string") {
          return;
        }

        const videosReq = await getVideo(videoId);

        setVideo(videosReq.data);
      } catch (e) {
        router.push("/videos");
        console.log(e);
      }
    },
    [videoId, router]
  );

  useEffect(() => {
    load();
  }, [load]);

  function getFullName(user: User) {
    return `${user.firstName} ${user.secondName}`.trim();
  }

  const whoLiked = new Set(video?.usersWhoLike.map((user) => user.id) || []);

  async function toggleLikeHandler() {
    try {
      const toggleRes = await toggleLike(videoId.toString());

      setVideo(toggleRes.data);
    } catch (e) {
      console.log(e);
    }
  }

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  async function sendComment() {
    if (!commentText) {
      setCommentError("Вы оставили поле пустым.");
      return;
    }

    setCommentError("");
    await addComment(videoId.toString(), commentText);

    setCommentText("");
  }

  const [comments, setComments] = useState<Map<number, Comment>>();

  useEffect(() => {
    return setComments(
      new Map<number, Comment>(
        (video?.comments || []).map((comment: Comment) => [comment.id, comment])
      )
    );
  }, [video]);

  useEffect(() => {
    if (!GlobalStore.ws) {
      return;
    }

    function handler(event) {
      const message = JSON.parse(event.data);

      if (message.event === "newComment") {
        const newComment = message.data as Comment;

        if (newComment.videoId.toString() !== videoId.toString()) {
          return;
        }

        const newMap = new Map(comments);
        newMap.set(newComment.id, newComment);

        setComments(newMap);
      }
    }

    GlobalStore.ws.addEventListener("message", handler);

    return () => {
      GlobalStore.ws.removeEventListener("message", handler);
    };
  }, [videoId, comments]);

  return (
    <Box margin={"30px 10px"}>
      <Head>
        <title>«{video?.name}» - VideoHosting</title>
      </Head>
      <Breadcrumbs aria-label="breadcrumb">
        <NextLink href="/" passHref>
          <Link color="inherit">Главная</Link>
        </NextLink>
        <NextLink href="/videos" passHref>
          <Link color="inherit">Список видео</Link>
        </NextLink>
        {video ? <Typography color="textPrimary">{video.name}</Typography> : ""}
      </Breadcrumbs>
      {!video ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className={classes.main}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="stretch"
          className={classes.main}
        >
          <Typography variant="h4" gutterBottom>
            {video.name}
          </Typography>
          <Paper elevation={3} classes={{ root: classes.paperRoot }}>
            <VideoPlayer videoId={videoId.toString()} />
          </Paper>
          <Box display="flex" className={classes.author} alignItems="center">
            <Avatar
              alt="Аватарка"
              src={video.author.avatar}
              className={classes.largeAvatar}
            />
            <Typography variant="h6" className={classes.authorName}>
              {getFullName(video.author)}
            </Typography>

            <Box
              display="flex"
              className={classes.like}
              justifyContent="flex-end"
            >
              <ToggleButton
                value="check"
                selected={whoLiked.has(GlobalStore.id)}
                onChange={toggleLikeHandler}
              >
                Нравится {video.usersWhoLike.length}
                <ThumbUpAltIcon />
              </ToggleButton>
            </Box>
          </Box>
          <Box alignSelf="center" className={classes.main}>
            <Typography variant="h5" gutterBottom>
              Комментарии:
            </Typography>

            {[...comments.values()].map((comment) => (
              <Grid
                key={comment.id}
                container
                wrap="nowrap"
                className={classes.container}
              >
                <Grid item>
                  <Avatar
                    alt="Аватарка"
                    src={comment.author.avatar}
                    className={classes.smallAvatar}
                  />
                </Grid>
                <Grid item xs zeroMinWidth>
                  <Typography variant="h6" className={classes.authorName}>
                    {getFullName(comment.author)}
                  </Typography>
                  <p style={{ textAlign: "left" }}>{comment.text}</p>
                  <Typography variant="caption" display="block" gutterBottom>
                    Отправлено {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            ))}

            <FormControl
              error={!!commentError}
              className={classes.secondContainer}
            >
              <Box className={classes.textArea}>
                <TextareaAutosize
                  aria-label="Комментарий"
                  placeholder="Введите комментарий"
                  rowsMin={5}
                  rowsMax={7}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                  }}
                  value={commentText}
                />
                <FormHelperText>{commentError}</FormHelperText>
              </Box>

              <Button
                variant="contained"
                component="span"
                startIcon={<SendIcon />}
                color="primary"
                onClick={sendComment}
              >
                Отправить
              </Button>
            </FormControl>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default observer(VideoPage);
