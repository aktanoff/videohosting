import Comment from "./comment";
import User from "./user";

type Video = {
  id: number;
  authorId: number;
  usersWhoLike: User[];
  author: User;
  name: string;
  path: string;
  availableQualities: Array<string>;
  qualities: Array<string>;
  previews: Array<string>;
  activePreview: number;
  comments: Comment[];
  createdAt: Date;
};

export default Video;
