import express from 'express';
import {
  signUp,
  login,
  logout,
  refreshToken,
  deleteUser,
  addProfile,
  getCurrentUser,
} from '../controller/user.js';
import { authenticateToken } from '../utilities/middleware.js';

const router = express.Router();

router.post('/create', signUp, login);

router.post('/login', login);

router.delete('/logout', authenticateToken, logout);

router.post('/refreshToken', refreshToken);

router.delete('/delete', authenticateToken, deleteUser);

router.post('/addProfile', authenticateToken, addProfile);

router.get('/getCurrentUser', authenticateToken, getCurrentUser);

export default router;
