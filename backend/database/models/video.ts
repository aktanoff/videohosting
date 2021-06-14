import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  AllowNull,
  Default,
  AutoIncrement,
  PrimaryKey,
  HasMany,
} from "sequelize-typescript";
import LikeUserVideo from "./likeUserVideo";
import Comment from "./comment";
import User from "./user";

@Table
class Video extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  authorId: number;

  @BelongsToMany(() => User, () => LikeUserVideo, "videoId")
  usersWhoLike: User[];

  @BelongsTo(() => User, "authorId")
  author: User;

  @HasMany(() => Comment, {
    foreignKey: "videoId",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true,
  })
  comments: Comment[];

  @AllowNull(false)
  @Default("")
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  path: string;

  @Default([])
  @Column(DataType.ARRAY(DataType.ENUM("360", "480", "720", "1080")))
  availableQualities: Array<string>;

  @Default([])
  @Column(DataType.ARRAY(DataType.ENUM("360", "480", "720", "1080")))
  qualities: Array<string>;

  @Column(DataType.ARRAY(DataType.STRING))
  previews: Array<string>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  activePreview: number;
}

export default Video;
