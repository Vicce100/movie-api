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

const router = express.Router();

router.post('/create', signUp, login);

router.post('/login', login);

router.delete('/logout', isAuthenticate, logout);

router.post('/refreshToken', refreshToken);

router.delete('/delete', isAuthenticate, deleteUser);

router.post('/addProfile', isAuthenticate, addProfile);

router.get('/getCurrentUser', isAuthenticate, getCurrentUser);

router.get('/checkAuth', checkAuthFunction);

// rolesType = 'user' | 'moderator' | 'admin' | 'superAdmin'
router.get('/checkAuth/:roleType', checkAuthRole);

export default router;
