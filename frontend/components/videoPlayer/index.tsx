import {
  Box,
  Button,
  Grid,
  IconButton,
  LinearProgress,
  makeStyles,
  Popover,
  Slider,
  Theme,
  Typography,
} from "@material-ui/core";
import Hls from "hls.js";
import React, {
  MouseEvent,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import theme from "../theme";
import {
  Fullscreen,
  Pause,
  PlayArrow,
  VolumeDown,
  VolumeUp,
} from "@material-ui/icons";

type StyleProps = {
  controlsActive: boolean;
};

const useStyles = makeStyles<Theme, StyleProps>({
  container: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    maxHeight: "100%",
    display: "block",
  },
  controls: (state) => ({
    padding: "0 10px",
    position: "absolute",
    bottom: state.controlsActive ? "0" : "-40px",
    transition: "0.1s bottom",
    height: "36px",
    width: "100%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
  }),
  timer: {
    padding: "0 8px",
    color: theme.palette.primary.main,
  },
  progressBar: {
    flexGrow: 1,
    cursor: "pointer",
    height: "14px",
    margin: "0 18px",
    border: `2px solid ${theme.palette.info.light}`,
  },
  "@keyframes Custom-MuiLinearProgress-keyframes-buffer": {
    "0%": {
      backgroundPosition: "0 -20px",
    },
    "100%": {
      backgroundPosition: "-200px -20px",
    },
  },
  dashedColorPrimary: {
    animation: "$Custom-MuiLinearProgress-keyframes-buffer 10s infinite linear",
  },
  bar1Buffer: {
    transition: "none",
  },
  volumeContainer: {
    alignItems: "center",
    width: "150px",
  },
  qualitiesButton: {
    marginLeft: "10px",
  },
});

function secondsToFormattedString(seconds: number): string {
  if (seconds < 0) {
    return "Некорректный ввод";
  }

  function addZeroBefore(number: number) {
    const rounded = Math.floor(number);

    let result = rounded.toString();
    if (rounded < 10) {
      result = "0" + result;
    }

    return result;
  }

  return `${addZeroBefore(seconds / 60)}:${addZeroBefore(seconds % 60)}`;
}

function debounce(func: (...args: never[]) => void, delay: number) {
  let task: NodeJS.Timeout;

  function Worker() {
    clearTimeout(task);
    task = setTimeout(() => {
      func.apply(null);
    }, delay);
  }

  Worker.cancel = () => {
    clearTimeout(task);
  };

  return Worker;
}

function throttle(func: (...args: never[]) => void, delay: number) {
  let timer = 0;

  return () => {
    const now = Date.now();

    if (now - timer > delay) {
      func.apply(null);
      timer = now;
    }
  };
}

function VideoPlayer({ videoId }: { videoId: string }): ReactElement {
  const [controlsActive, setControlsActive] = useState<boolean>(false);
  const classes = useStyles({
    controlsActive,
  });

  const [volume, setVolume] = useState(100);
  const [qualities, setQualities] = useState([]);
  const [quality, setQuality] = useState(-1);
  const [hls, setHls] = useState<Hls | undefined>();

  const videoElement = useRef<HTMLVideoElement | undefined>();
  const videoContainer = useRef<HTMLDivElement | undefined>();
  const barElement = useRef<HTMLDivElement | undefined>();

  const [playing, setPlaying] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [bufferProgress, setBufferProgress] = useState<number>(0);

  const [anchorEl, setAnchorEl] = useState(null);
  const changeQualityOpen = Boolean(anchorEl);

  const changeQualityHandler = (event) => {
    setAnchorEl(!anchorEl ? event.currentTarget : null);
  };

  const changeQualityCloseHandler = () => {
    setAnchorEl(null);
  };

  function changeLevel(qualityIndex) {
    hls.stopLoad();

    hls.currentLevel = qualityIndex;
    setQuality(qualityIndex);

    hls.startLoad();
  }

  useEffect(() => {
    const container = videoContainer.current;
    const bar = barElement.current;
    const video = videoElement.current;

    if (!container || !bar || !video) {
      return;
    }

    const debouncedTrigger = debounce(() => {
      setControlsActive(false);
    }, 3000);

    if (!changeQualityOpen) {
      debouncedTrigger();
    }

    const MouseMoveHandler = throttle(() => {
      setControlsActive(true);

      if (!changeQualityOpen) {
        debouncedTrigger();
      }
    }, 20);

    function MouseDownHandler(e) {
      const rect = bar.getBoundingClientRect();

      const newProgress = (e.pageX - rect.x) / bar.offsetWidth;

      video.currentTime = newProgress * video.duration;

      setProgress(newProgress);
    }

    container.addEventListener("mousemove", MouseMoveHandler);
    bar.addEventListener("mousedown", MouseDownHandler);

    return () => {
      container.removeEventListener("mousemove", MouseMoveHandler);
      bar.removeEventListener("mousedown", MouseDownHandler);

      debouncedTrigger.cancel();
    };
  }, [changeQualityOpen]);

  useEffect(() => {
    if (!videoElement.current) {
      return;
    }

    const video = videoElement.current;

    function TimeUpdateHandler() {
      setProgress(video.currentTime / video.duration);
    }

    function ProgressHandler() {
      if (video.buffered.length === 0) {
        return;
      }

      const neededBufferIndex = [...new Array(video.buffered.length)].findIndex(
        (_, i) => {
          const end = video.buffered.end(i);

          return video.currentTime <= end;
        }
      );

      if (neededBufferIndex === -1) {
        return;
      }

      const newBufferProgress =
        video.buffered.end(neededBufferIndex) / this.duration;

      setBufferProgress(newBufferProgress * 100);
    }

    function LoadedMetaDataHandler() {
      setVideoDuration(video.duration);
    }

    function PauseHandler() {
      setPlaying(false);
    }

    function PlayHandler() {
      setPlaying(true);
    }

    video.addEventListener("pause", PauseHandler);
    video.addEventListener("play", PlayHandler);
    video.addEventListener("loadedmetadata", LoadedMetaDataHandler);
    video.addEventListener("timeupdate", TimeUpdateHandler);
    video.addEventListener("progress", ProgressHandler);

    return () => {
      video.removeEventListener("pause", PauseHandler);
      video.removeEventListener("play", PlayHandler);
      video.removeEventListener("loadedmetadata", LoadedMetaDataHandler);
      video.removeEventListener("timeupdate", TimeUpdateHandler);
      video.removeEventListener("progress", ProgressHandler);
    };
  }, []);

  useEffect(() => {
    if (!videoElement.current) {
      return;
    }

    const videoSrc = `/api/video/${videoId}/hls.m3u8`;

    if (!Hls.isSupported()) {
      // Если не поддерживается MSE, но есть возможность нативно запустить видео, то подключаем манифест напрямую.
      if (videoElement.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.current.src = videoSrc;
      }

      return;
    }

    const config = {
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
    };

    const hls = new Hls(config);
    setHls(hls);

    hls.attachMedia(videoElement.current);

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      hls.loadSource(videoSrc);
      hls.on(Hls.Events.MANIFEST_PARSED, function (_, data) {
        setQualities(data.levels.map((level) => level.height));
      });
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
      console.log("err", event, data);
    });

    return () => {
      hls.destroy();
      setPlaying(false);
      setProgress(0);
    };
  }, [videoId]);

  function videoClickHandler(e: MouseEvent) {
    e.preventDefault();

    if (!videoElement.current) {
      return;
    }

    const videoTarget = videoElement.current as HTMLVideoElement;

    if (!videoTarget) {
      return;
    }

    if (!playing) {
      setPlaying(true);
      videoTarget.play();
      return;
    }

    setPlaying(false);
    videoTarget.pause();
  }

  return (
    <div className={classes.container} ref={videoContainer}>
      <video
        ref={videoElement}
        className={classes.video}
        onClick={videoClickHandler}
      ></video>
      <div className={classes.controls}>
        <IconButton aria-label="Пауза/Плей" onClick={videoClickHandler}>
          {playing ? <Pause color="primary" /> : <PlayArrow color="primary" />}
        </IconButton>

        <Typography variant="button" className={classes.timer}>
          {secondsToFormattedString(videoDuration * (progress || 0))}
          {" / "}
          {secondsToFormattedString(videoDuration)}
        </Typography>

        <LinearProgress
          variant="buffer"
          value={progress * 100}
          valueBuffer={bufferProgress}
          className={classes.progressBar}
          classes={{
            dashedColorPrimary: classes.dashedColorPrimary,
            bar1Buffer: classes.bar1Buffer,
          }}
          ref={barElement}
        />

        <Grid container spacing={1} className={classes.volumeContainer}>
          <Grid item>
            <VolumeDown />
          </Grid>
          <Grid item xs>
            <Slider
              value={volume}
              onChange={(_, v: number) => {
                setVolume(v);

                if (!videoElement.current) {
                  return;
                }
                videoElement.current.volume = v / 100;
              }}
            />
          </Grid>
          <Grid item>
            <VolumeUp />
          </Grid>
        </Grid>

        <div className={classes.qualitiesButton}>
          <Button
            variant="contained"
            color="primary"
            onClick={changeQualityHandler}
          >
            {quality === -1 ? "Авто" : qualities[quality]}
          </Button>

          <Popover
            open={changeQualityOpen}
            anchorEl={anchorEl}
            onClose={changeQualityCloseHandler}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            disablePortal
          >
            <Box display="flex" flexDirection="column">
              <Button onClick={() => changeLevel(-1)}>Авто</Button>
              {qualities.map((currentQuality, index) => (
                <Button key={currentQuality} onClick={() => changeLevel(index)}>
                  {currentQuality}
                </Button>
              ))}
            </Box>
          </Popover>
        </div>
        <IconButton
          color="primary"
          aria-label="Перейти в полноэкранный режим"
          component="span"
          onClick={() => {
            const elem = videoContainer.current;

            if (!elem) {
              return;
            }

            if (!document.fullscreenElement) {
              elem.requestFullscreen().catch((err) => {
                alert(
                  `Ошибка переключения в полноэкранный режим: ${err.message} (${err.name})`
                );
              });
            } else {
              document.exitFullscreen().then(() => {
                elem.scrollIntoView({
                  block: "center",
                });
              });
            }
          }}
        >
          <Fullscreen />
        </IconButton>
      </div>
    </div>
  );
}

export default VideoPlayer;
