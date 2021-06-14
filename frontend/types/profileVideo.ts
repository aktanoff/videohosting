import Video from "./video";

type ProfileVideo = Video & {
  editing: boolean;
  nameError: string;
};

export default ProfileVideo;
