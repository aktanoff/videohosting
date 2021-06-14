import { Sequelize } from "sequelize-typescript";
import LikeUserVideo from "./models/likeUserVideo";
import Comment from "./models/comment";
import User from "./models/user";
import Video from "./models/video";

export default async function (sync = false): Promise<void> {
  const sequelize = new Sequelize({
    database: process.env.DB_USER,
    dialect: "postgres",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  });

  sequelize.addModels([Comment, User, Video, LikeUserVideo]);

  if (sync) {
    await sequelize.sync({ force: true });
  }

  // await LikeUserVideo.create({ userId: 2, videoId: 1 });
  // await LikeUserVideo.create({ userId: 2, videoId: 2 });

  // const user1 = await User.findOne({
  //   where: { id: 1 },
  //   include: ["likedVideos"],
  // });
  // const user2 = await User.findOne({
  //   where: { id: 2 },
  //   include: ["likedVideos"],
  // });
  // const video1 = await Video.findOne({ where: { id: 1 } });
  // const video2 = await Video.findOne({
  //   where: { id: 2 },
  //   include: ["usersWhoLike"],
  // });

  // console.log(video2.usersWhoLike);
}
