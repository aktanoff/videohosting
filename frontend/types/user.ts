import Video from "./video";

type User = {
  id: number;
  firstName: string;
  secondName: string;
  email: string;
  avatar: string;
  ownVideos: Video[];
  likedVideos: Video[];
};

export default User;
