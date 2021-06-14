import {
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from "sequelize-typescript";
import User from "./user";
import Video from "./video";

@Table
class LikeUserVideo extends Model {
  @ForeignKey(() => User)
  @Index({
    unique: true,
    name: "like-user-video-unique",
  })
  @Column(DataType.INTEGER)
  userId: number;

  @ForeignKey(() => Video)
  @Index({
    unique: true,
    name: "like-user-video-unique",
  })
  @Column(DataType.INTEGER)
  videoId: number;
}

export default LikeUserVideo;
