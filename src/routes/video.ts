import express from 'express';
import {
  isAuthenticate,
  multerErrorHandler,
  fileFilterAll as fileFilter,
  isAdmin,
} from '../utilities/middleware.js';
import multer, { diskStorage } from 'multer';
import {
  getMovie,
  getEpisode,
  addView,
  getMovieData,
  getEpisodeData,
  getSeriesData,
  getSeriesEpisodes,
  getVideosData,
  getMoviesDataByCategory,
  getSeriesDataByCategory,
  uploadMovie,
  createSeries,
  deleteMovie,
  deleteEpisode,
  nuke,

  // videos watched -->
  addToMoviesWatched,
  addToSeriesWatched,
  removeEpisodeWatched,
  setSeriesWatchedActiveEpisode,
  updateSeriesWatchedActiveEpisode,
  addToSeriesWatchedEpisodes,
  updateSeriesWatchedEpisode,
  updateMoviesWatched,
  removeMovieWatched,
  generateFFmpegToMovie,
  generateFFmpegToEpisode,
  removeFFmpegFromMovie,
  removeFFmpegFromEpisode,
  addEpisodesTOSeries,
  getSearchData,
  updateMovie,
  getSearchMovieData,
  getSearchSeresData,
  addIdToSavedList,
  removeIdFromSavedList,
  removeSeriesWatched,
  uploadMovieObject,
  uploadMovieFile,
  getVideo,
  addIdToLikedList,
  removeIdFromLikedList,
  getMoviesInfinityScroll,
  getSeriesInfinityScroll,
  searchMoviesInfinityScroll,
  searchSeriesInfinityScroll,
} from '../controller/video.js';
import { cleanString, routesString as rs } from '../utilities/index.js';
import { isWatchingPaths as iw } from '../utilities/types.js';

const router = express.Router();

router.use(isAuthenticate);

const publicVideoStorage = diskStorage({
  destination: (_req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'video') return cb(null, 'uploads/videos/public/');
    else if (fileType === 'image') return cb(null, 'uploads/images/public/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const privateVideoStorage = diskStorage({
  destination: (_req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'video') return cb(null, 'uploads/videos/private/');
    else if (fileType === 'image') return cb(null, 'uploads/images/private/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const publicVideoUpload = multer({ storage: publicVideoStorage, fileFilter });
const privateVideoUpload = multer({ storage: privateVideoStorage, fileFilter });

router.get(`/${rs.movie}/:${rs.movieId}`, getMovie);

router.get(`/${rs.episode}/:${rs.episodeId}`, getEpisode);

router.get(`/${rs.play}/:${rs.id}`, getVideo);

router.post(`/${rs.addView}`, addView);

router.get(`/${rs.movie}/${rs.data}/:${rs.movieId}`, getMovieData);

router.get(`/${rs.series}/${rs.data}/:${rs.seriesId}`, getSeriesData);

router.get(`/${rs.episodes}/${rs.all}/:${rs.seriesId}`, getSeriesEpisodes);

router.get(`/${rs.episode}/${rs.data}/:${rs.episodeId}`, getEpisodeData);

router.post(`/${rs.data}`, getVideosData);

router.post(`/${rs.movie}/${rs.data}/${rs.category}`, getMoviesDataByCategory);

router.post(`/${rs.series}/${rs.data}/${rs.category}`, getSeriesDataByCategory);

router.get(`/${rs.search}`, getSearchData);

router.get(`/${rs.search}/${rs.movie}`, getSearchMovieData);

router.get(`/${rs.search}/${rs.series}`, getSearchSeresData);

router.post(`/${rs.movie}/${rs.update}`, isAdmin, updateMovie);

router.delete(`/${rs.movie}/${rs.delete}/:${rs.movieId}`, isAdmin, deleteMovie);

router.delete(
  `/${rs.episode}/${rs.delete}/:${rs.episodeId}`,
  isAdmin,
  deleteEpisode
);

router.post(`/${rs.add}/${rs.savedList}`, addIdToSavedList);

router.post(`/${rs.remove}/${rs.savedList}`, removeIdFromSavedList);

router.post(`/${rs.add}/${rs.likedList}`, addIdToLikedList);

router.post(`/${rs.remove}/${rs.likedList}`, removeIdFromLikedList);

router.get(`/${rs.data}/${rs.movie}/${rs.infinity}`, getMoviesInfinityScroll);

router.get(`/${rs.data}/${rs.series}/${rs.infinity}`, getSeriesInfinityScroll);

router.get(
  `/${rs.data}/${rs.movie}/${rs.infinity}/:${rs.searchId}`,
  searchMoviesInfinityScroll
);

router.get(
  `/${rs.data}/${rs.series}/${rs.infinity}/:${rs.searchId}`,
  searchSeriesInfinityScroll
);

// videos watched -->
router.post(`/${rs.movie}/${iw.addToMoviesWatched}`, addToMoviesWatched);

router.post(`/${rs.movie}/${iw.updateMoviesWatched}`, updateMoviesWatched);

router.post(`/${rs.movie}/${iw.removeMovieWatched}`, removeMovieWatched);

router.post(`/${rs.series}/${iw.addToSeriesWatched}`, addToSeriesWatched);

router.post(`/${rs.series}/${iw.removeSeriesWatched}`, removeSeriesWatched);

router.post(`/${rs.series}/${iw.removeEpisodeWatched}`, removeEpisodeWatched);

// router.get('/nuke', isAuthenticate, isSuperAdmin, nuke);

router.post(
  `/${rs.series}/${iw.setSeriesWatchedActiveEpisode}`,
  setSeriesWatchedActiveEpisode
);

router.post(
  `/${rs.series}/${iw.updateSeriesWatchedActiveEpisode}`,
  updateSeriesWatchedActiveEpisode
);

router.post(
  `/${rs.series}/${iw.addToSeriesWatchedEpisodes}`,
  addToSeriesWatchedEpisodes
);

router.post(
  `/${rs.series}/${iw.updateSeriesWatchedEpisode}`,
  updateSeriesWatchedEpisode
);

router.post(
  `/${rs.movie}/${rs.create}`,
  isAdmin,
  publicVideoUpload.fields([{ name: 'videoFile', maxCount: 1 }]),
  multerErrorHandler,
  uploadMovie
);

router.post(`/${rs.movie}/${rs.upload}/object`, isAdmin, uploadMovieObject);

router.post(`/${rs.movie}/${rs.upload}/file`, isAdmin, uploadMovieFile);

router.post(
  `/${rs.series}/${rs.create}`,
  isAdmin,
  publicVideoUpload.single('displayPicture'),
  multerErrorHandler,
  createSeries
);

router.post(
  `/${rs.episode}/${rs.add}`,
  isAdmin,
  publicVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  addEpisodesTOSeries
);

router.get(
  `/${rs.movie}/${rs.ffmpeg}/:${rs.movieId}`,
  isAdmin,
  generateFFmpegToMovie
);

router.get(
  `/${rs.episode}/${rs.ffmpeg}/:${rs.episodeId}`,
  isAdmin,
  generateFFmpegToEpisode
);

router.get(
  `/${rs.movie}/${rs.ffmpeg}/${rs.remove}/:${rs.movieId}`,
  isAdmin,
  removeFFmpegFromMovie
);

router.get(
  `/${rs.episode}/${rs.ffmpeg}/${rs.remove}/:${rs.episodeId}`,
  isAdmin,
  removeFFmpegFromEpisode
);

export default router;
