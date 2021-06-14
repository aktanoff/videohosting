import axios, { AxiosPromise } from "axios";
import Router from "next/router";
import { URL, unauthorizedPages } from "./config";

axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response.status === 401) {
      if (!unauthorizedPages.has(Router.pathname)) {
        Router.push("/");
      }
    } else {
      return Promise.reject(error);
    }
  }
);

export const getVideos = (): AxiosPromise => axios.get(`${URL}/video`);

export const getVideo = (videoId: string): AxiosPromise =>
  axios.get(`${URL}/video/${videoId}`);

export const toggleLike = (videoId: string): AxiosPromise =>
  axios.post(`${URL}/video/${videoId}/toggleLike`);

export const getFavouriteVideos = (): AxiosPromise =>
  axios.get(`${URL}/video/favourites`);

export const getMyVideos = (): AxiosPromise => axios.get(`${URL}/video/my`);

export const addComment = (videoId: string, text: string): AxiosPromise =>
  axios.post(`${URL}/video/${videoId}/comment`, { text });

export const updateVideo = (
  videoId: number | string,
  name: string,
  activePreview: number
): AxiosPromise =>
  axios.patch(`${URL}/video/${videoId}`, { name, activePreview });

export const deleteVideo = (videoId: number | string): AxiosPromise =>
  axios.delete(`${URL}/video/${videoId}`);

export const uploadVideo = (
  formdata: FormData,
  onUploadProgress: (progressEvent: { loaded: number }) => void
): AxiosPromise =>
  axios.post(`${URL}/video`, formdata, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
