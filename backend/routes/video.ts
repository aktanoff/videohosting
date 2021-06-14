import express from "express";
import User from "../database/models/user";
import Video from "../database/models/video";
import authorizedMiddleware from "../passport/authorizedMiddleware";
import videoUploader from "../uploaders/videoUploader";
import * as fs from "fs";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import { Op, Sequelize } from "sequelize";
import LikeUserVideo from "../database/models/likeUserVideo";
import Comment from "../database/models/comment";
import { sendToEveryoneWS, sendToUserWS } from "../websocket";

function setsEqual(set1: Set<unknown>, set2: Set<unknown>): boolean {
  if (set1.size !== set2.size) {
    return false;
  }

  for (const element of set1) {
    if (!set2.has(element)) {
      return false;
    }
  }

  return true;
}

export default function (app: express.Router): void {
  const router = express.Router();
  app.use("/video", router);

  router.post("/", videoUploader.single("video"), async function (req, res) {
    if (!req.file || !req.user) {
      return res.sendStatus(409);
    }

    try {
      const thumbnails = await new Promise((resolve, reject) => {
        const pathPrefix = req.file.destination.substring(1);

        let thumbnails: Array<string>;
        ffmpeg(req.file.path)
          .on("filenames", function (filenames: Array<string>) {
            thumbnails = filenames.map(
              (filename) => `${pathPrefix}/${filename}`
            );
          })
          .on("end", function () {
            if (!thumbnails) {
              reject("Не удалось получить превью");
              return;
            }

            resolve(thumbnails);
          })
          .on("error", function (err) {
            reject(err);
          })
          .takeScreenshots({ count: 4, size: "210x118" }, req.file.destination);
      });

      const metadata: FfprobeData = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(
          req.file.path,
          function (err: Error, metadata: FfprobeData) {
            if (err) {
              return reject(err);
            }

            resolve(metadata);
          }
        );
      });

      const firstVideoStream = metadata.streams.filter(
        (stream) => stream.codec_type === "video"
      )[0];

      if (!firstVideoStream) {
        throw new Error("В видео отсутствуют видеодорожки");
      }

      const destinationParts = req.file.destination.split("/");
      const path = destinationParts[destinationParts.length - 1];

      const user = req.user as User;

      const profiles = [
        {
          height: 360,
          avgbitrate: "800k",
          maxrate: "856k",
          bufsize: "1200k",
          filenametemplate: "360p_%03d.ts",
          manifestname: "360p.m3u8",
        },
        {
          height: 480,
          avgbitrate: "1400k",
          maxrate: "1498k",
          bufsize: "2100k",
          filenametemplate: "480p_%03d.ts",
          manifestname: "480p.m3u8",
        },
        {
          height: 720,
          avgbitrate: "2800k",
          maxrate: "2996k",
          bufsize: "4200k",
          filenametemplate: "720p_%03d.ts",
          manifestname: "720p.m3u8",
        },
        {
          height: 1080,
          avgbitrate: "5600k",
          maxrate: "5992k",
          bufsize: "8400k",
          filenametemplate: "1080p_%03d.ts",
          manifestname: "1080p.m3u8",
        },
      ];

      // Находим все качества которые ниже или равны исходному видео
      const availableProfiles = profiles.filter(
        (profile) => profile.height <= firstVideoStream.height
      );
      if (!availableProfiles.length) {
        // Если качество исходника ниже 360p
        availableProfiles.push(profiles[0]);
      }

      const video = await Video.create({
        authorId: user.id,
        path,
        previews: thumbnails,
        qualities: availableProfiles.map((profile) =>
          profile.height.toString()
        ),
      });

      res.json(video);

      await Promise.all(
        availableProfiles.map((profile) =>
          new Promise((resolve, reject) => {
            ffmpeg(req.file.path)
              .addOptions([
                "-profile:v main",
                `-vf scale=-2:${profile.height}`,
                "-c:a aac",
                "-ar 48000",
                "-b:a 192k",
                "-c:v h264",
                "-crf 20",
                "-g 48",
                "-keyint_min 48",
                "-sc_threshold 0",
                `-b:v ${profile.avgbitrate}`,
                `-maxrate ${profile.maxrate}`,
                `-bufsize ${profile.bufsize}`,
                "-hls_time 10",
                `-hls_segment_filename ${req.file.destination}/${profile.filenametemplate}`,
                "-hls_playlist_type vod",
                "-f hls",
              ])
              .output(`${req.file.destination}/${profile.manifestname}`)
              .on("progress", function (progress) {
                sendToUserWS(user.id, {
                  event: "videoProgress",
                  data: {
                    videoId: video.id,
                    profileHeight: profile.height,
                    progress,
                  },
                });
              })
              .on("error", function (err, stdout, stderr) {
                if (err) {
                  console.log(err.message);
                  console.log("stdout:\n" + stdout);
                  console.log("stderr:\n" + stderr);
                  reject(err);
                }
              })
              .on("end", function () // stdout, stderr
              {
                sendToUserWS(user.id, {
                  event: "videoEnd",
                  data: {
                    videoId: video.id,
                    profileHeight: profile.height,
                  },
                });

                resolve(profile.height.toString());
              })
              .run();
          }).then((resolutionString: string) => {
            video.availableQualities = [
              ...video.availableQualities,
              resolutionString,
            ];
            video.save();
          })
        )
      );

      fs.rm(req.file.path, (err) => {
        if (err) {
          console.log("Ошибка при удалении исходного файла", err);
        }
      });
    } catch (e) {
      console.log("Ошибка в процессе преобразования", e);
    }
  });

  router.get("/", authorizedMiddleware, async function (req, res) {
    const videos = await Video.findAll({
      where: {
        [Op.and]: [
          {
            name: {
              [Op.ne]: "",
            },
          },
          Sequelize.where(
            Sequelize.fn(
              "array_length",
              Sequelize.col("availableQualities"),
              1
            ),
            {
              [Op.gt]: 0,
            }
          ),
        ],
      },
      order: [["id", "ASC"]],
    });

    res.json(videos);
  });

  router.get("/my", authorizedMiddleware, async function (req, res) {
    const userId = (req.user as User).id;

    try {
      const videos = await Video.findAll({
        where: {
          authorId: userId,
        },
        order: [["id", "DESC"]],
      });

      res.json(videos);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  router.get("/favourites", authorizedMiddleware, async function (req, res) {
    const userId = (req.user as User).id;

    try {
      const { likedVideos } = await User.findOne({
        where: { id: userId },
        include: [
          {
            association: "likedVideos",
            where: {
              [Op.and]: [
                {
                  name: {
                    [Op.ne]: "",
                  },
                },
                Sequelize.where(
                  Sequelize.fn(
                    "array_length",
                    Sequelize.col("availableQualities"),
                    1
                  ),
                  {
                    [Op.gt]: 0,
                  }
                ),
              ],
            },
          },
        ],
      });

      res.json(likedVideos);
    } catch (e) {
      res.json([]);
    }
  });

  router.patch("/:videoId", authorizedMiddleware, async function (req, res) {
    const userId = (req.user as User).id;
    const { videoId } = req.params;

    const video = await Video.findOne({
      where: {
        authorId: userId,
        id: videoId,
      },
    });

    if (!video) {
      return res.sendStatus(401);
    }

    if (
      !req.body.name ||
      !Number.isInteger(req.body.activePreview) ||
      req.body.activePreview < 0 ||
      req.body.activePreview > video.previews.length - 1
    ) {
      return res.sendStatus(400);
    }

    video.name = req.body.name;
    video.activePreview = req.body.activePreview;
    await video.save();

    res.json(video);
  });

  router.delete("/:videoId", authorizedMiddleware, async function (req, res) {
    try {
      const userId = (req.user as User).id;
      const { videoId } = req.params;

      const video = await Video.findOne({
        where: {
          authorId: userId,
          id: videoId,
        },
      });

      if (!video) {
        return res.sendStatus(401);
      }

      const availableQualities = new Set(video.availableQualities);
      const qualities = new Set(video.qualities);

      if (!setsEqual(availableQualities, qualities)) {
        return res.status(400).json({
          error:
            "Необходимо дождаться обработки всех файлов перед удалением видео",
        });
      }

      await new Promise((resolve, reject) => {
        fs.rmdir(`./uploads/${video.path}`, { recursive: true }, (err) => {
          if (err) {
            return reject(err);
          }

          resolve("Папка была удалена");
        });
      });

      await video.destroy();

      res.json(video);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  router.get("/:videoId/hls.m3u8", authorizedMiddleware, async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findOne({
      where: {
        id: videoId,
      },
    });

    if (!video) {
      return res.sendStatus(404);
    }

    const configs: {
      [key: string]: {
        bandwidth: string;
        resolution: string;
      };
    } = {
      "360": {
        bandwidth: "1200",
        resolution: "640x360",
      },
      "480": {
        bandwidth: "2100",
        resolution: "854x480",
      },
      "720": {
        bandwidth: "4200",
        resolution: "1280x720",
      },
      "1080": {
        bandwidth: "8400",
        resolution: "1920x1080",
      },
    };

    res.setHeader("content-type", "application/vnd.apple.mpegurl");
    res.send(`#EXTM3U
${video.availableQualities
  .map(
    (quality) =>
      `#EXT-X-STREAM-INF:BANDWIDTH=${configs[quality].bandwidth},RESOLUTION=${configs[quality].resolution}` +
      "\n" +
      `/uploads/${video.path}/${quality}p.m3u8`
  )
  .join("\n")}`);
  });

  router.get("/:videoId", authorizedMiddleware, async (req, res) => {
    try {
      const { videoId } = req.params;

      const video = await Video.findOne({
        where: {
          [Op.and]: [
            {
              name: {
                [Op.ne]: "",
              },
              id: videoId,
            },
            Sequelize.where(
              Sequelize.fn(
                "array_length",
                Sequelize.col("availableQualities"),
                1
              ),
              {
                [Op.gt]: 0,
              }
            ),
          ],
        },
        include: [
          "usersWhoLike",
          "author",
          { association: "comments", include: ["author"] },
        ],
      });

      if (!video) {
        return res.sendStatus(404);
      }

      res.json(video);
    } catch (e) {
      console.log(e);
      res.sendStatus(400);
    }
  });

  router.post(
    "/:videoId/toggleLike",
    authorizedMiddleware,
    async (req, res) => {
      const { videoId } = req.params;

      try {
        const user = req.user as User;

        const entry = await LikeUserVideo.findOne({
          where: {
            userId: user.id,
            videoId: +videoId,
          },
        });

        if (entry) {
          await entry.destroy();
        } else {
          await LikeUserVideo.create({
            videoId: +videoId,
            userId: user.id,
          });
        }

        const video = await Video.findOne({
          where: {
            id: videoId,
          },
          include: [
            "usersWhoLike",
            "author",
            { association: "comments", include: ["author"] },
          ],
        });

        if (!video) {
          res.sendStatus(404);
        }
        res.json(video);
      } catch (e) {
        console.log(e);
        return res.sendStatus(400);
      }
    }
  );

  router.post("/:videoId/comment", authorizedMiddleware, async (req, res) => {
    const { videoId } = req.params;
    const { text } = req.body;

    try {
      const user = req.user as User;

      const comment = await Comment.create({
        authorId: user.id,
        videoId: +videoId,
        text,
      });

      // const video = await Video.findOne({
      //   where: {
      //     id: videoId,
      //   },
      //   include: [
      //     "usersWhoLike",
      //     "author",
      //     { association: "comments", include: ["author"] },
      //   ],
      // });

      // if (!video) {
      //   res.sendStatus(404);
      // }

      const createdComment = await Comment.findOne({
        where: { id: comment.id },
        include: ["author"],
      });

      sendToEveryoneWS({
        event: "newComment",
        data: createdComment,
      });

      res.json(createdComment);
    } catch (e) {
      console.log(e);
      return res.sendStatus(400);
    }
  });
}
