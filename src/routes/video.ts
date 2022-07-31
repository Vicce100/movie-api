import express from 'express';
import {
  isAuthenticate,
  multerErrorHandler,
  fileFilterAll as fileFilter,
} from '../utilities/middleware.js';
import multer from 'multer';
import {
  getMovie,
  getEpisode,
  addView,
  getMovieData,
  getSeriesData,
  getEpisodeData,
  getVideosData,
  getMoviesDataByCategory,
  getSeriesDataByCategory,
  uploadMovie,
  createSeries,
  deleteMovie,
  deleteEpisode,
  generateFFmpegToMovie,
  generateFFmpegToEpisode,
  removeFFmpegFromMovie,
  removeFFmpegFromEpisode,
  addEpisodesTOSeries,
} from '../controller/video.js';
import { cleanString, routesString as rs } from '../utilities/index.js';

const router = express.Router();

router.use(isAuthenticate);

const publicVideoStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'video') return cb(null, 'uploads/videos/public/');
    else if (fileType === 'image') return cb(null, 'uploads/images/public/');
  },
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${cleanString(file.originalname)}`),
});

const privateVideoStorage = multer.diskStorage({
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

router.post(`/${rs.addView}`, addView);

router.get(`/${rs.movie}/${rs.data}/:${rs.movieId}`, getMovieData);

router.get(`/${rs.series}/${rs.data}/:${rs.seriesId}`, getSeriesData);

router.get(`/${rs.episode}/${rs.data}/:${rs.episodeId}`, getEpisodeData);

router.post(`/${rs.data}`, getVideosData);

router.post(`/${rs.movie}/${rs.data}/${rs.category}`, getMoviesDataByCategory);

router.post(`/${rs.series}/${rs.data}/${rs.category}`, getSeriesDataByCategory);

router.delete(`/${rs.movie}/${rs.delete}/:${rs.movieId}`, deleteMovie);

router.delete(`/${rs.episode}/${rs.delete}/:${rs.episodeId}`, deleteEpisode);

router.post(
  `/${rs.movie}/${rs.create}`,
  publicVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  uploadMovie
);

router.post(
  `/${rs.series}/${rs.create}`,
  privateVideoUpload.single('displayPicture'),
  multerErrorHandler,
  createSeries
);

router.post(
  `/${rs.episode}/${rs.add}`,
  privateVideoUpload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'displayPicture', maxCount: 1 },
  ]),
  multerErrorHandler,
  addEpisodesTOSeries
);

router.get(`/${rs.movie}/${rs.ffmpeg}/:${rs.movieId}`, generateFFmpegToMovie);

router.get(
  `/${rs.episode}/${rs.ffmpeg}/:${rs.episodeId}`,
  generateFFmpegToEpisode
);

router.get(
  `/${rs.movie}/${rs.ffmpeg}/${rs.remove}/:${rs.movieId}`,
  removeFFmpegFromMovie
);

router.get(
  `/${rs.episode}/${rs.ffmpeg}/${rs.remove}/:${rs.episodeId}`,
  removeFFmpegFromEpisode
);

export default router;
