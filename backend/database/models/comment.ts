import {
  Table,
  Column,
  Model,
  DataType,
  AutoIncrement,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user";
import Video from "./video";

@Table
class Comment extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  authorId: number;

  @BelongsTo(() => User, "authorId")
  author: User;

  @ForeignKey(() => Video)
  @Column(DataType.INTEGER)
  videoId: number;

  @BelongsTo(() => Video, "videoId")
  video: Video;

  @Column(DataType.STRING)
  text: string;
}

export default Comment;
