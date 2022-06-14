import express from 'express';
import {
  signUp,
  login,
  logout,
  refreshToken,
  deleteUser,
  addProfile,
} from '../controller/user.js';
import { authenticateToken } from '../utilities/middleware.js';
import User from '../schemas/UserSchema.js';
import api from '../utilities/api/index.js';
import { UserType } from '../utilities/types.js';

const router = express.Router();

router.post('/create', signUp, login);

router.post('/login', login);

router.delete('/logout', authenticateToken, logout);

router.post('/refreshToken', refreshToken);

router.delete('/delete', authenticateToken, deleteUser);

router.post('/addProfile', authenticateToken, addProfile);

// get all users
router.get('/getAll', authenticateToken, async (req, res) => {
  try {
    const user: UserType[] = await User.find();
    return res.json(user);
  } catch (error: any) {
    return res
      .status(500)
      .json(api.returnErrorData('internal server error', 500));
  }
});

export default router;
