import express from 'express';

import {
  signUp,
  login,
  logout,
  refreshToken,
  deleteUser,
  addProfile,
  getCurrentUser,
  checkAuthFunction,
  checkAuthRole,
} from '../controller/user.js';
import { isAuthenticate } from '../utilities/middleware.js';
import { routesString as rs } from '../utilities/index.js';

const router = express.Router();

router.post(`/${rs.create}`, signUp, login);

router.post(`/${rs.login}`, login);

router.delete(`/${rs.logout}`, isAuthenticate, logout);

router.post(`/${rs.refreshToken}`, refreshToken);

router.delete(`/${rs.delete}`, isAuthenticate, deleteUser);

router.post(`/${rs.addProfile}`, isAuthenticate, addProfile);

router.get(`/${rs.getCurrentUser}`, isAuthenticate, getCurrentUser);

router.get(`/${rs.checkAuth}`, checkAuthFunction);

// rolesType = 'user' | 'moderator' | 'admin' | 'superAdmin'
router.get(`/${rs.checkAuth}/:${rs.roleType}`, checkAuthRole);

export default router;
