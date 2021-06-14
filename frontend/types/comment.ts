import User from "./user";
import Video from "./video";

type Comment = {
  id: number;
  authorId: number;
  author: User;
  videoId: number;
  video: Video;
  text: string;
  createdAt: Date;
};

export default Comment;
