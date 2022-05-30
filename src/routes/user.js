/* eslint-disable no-underscore-dangle */
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../modules/User.js';
import { authenticateToken } from '../utilities/middleware.js';
import { generateAccessToken } from '../utilities/generateAccessToken.js';
dotenv.config();
const router = express.Router();
// create a user
router.post('/create', async (req, res) => {
    const { username, name, email, password, } = req.body;
    if (!password || !username || !name || !email)
        return res.status(404).send('non empty data in field. ');
    if (await User.findOne({ username }))
        return res.status(400).json({ message: 'username alredy taken. ' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new User({
        username,
        name,
        email,
        password: hashedPassword,
    });
    try {
        // const user = await User.create({ username, name, email, password: hashedPassword});
        await createdUser.save();
        // login after user gets created | skip password authentication
        const user = await User.findOne({ username });
        if (!user)
            return res.status(404).json("Canno't Find User");
        const { _id, createdAt } = user;
        try {
            let refreshToken = '';
            if (process.env.SECRET_REFRESH_TOKEN)
                refreshToken = jwt.sign(user, process.env.SECRET_REFRESH_TOKEN);
            await User.updateOne({ username }, { $set: { refreshToken } });
            const currentUser = {
                _id,
                username,
                name,
                email,
                createdAt,
                refreshToken,
            };
            return res
                .cookie('SSID', generateAccessToken(user), {
                sameSite: 'strict',
                path: '/',
                expires: new Date(new Date().getFullYear() + 100),
                httpOnly: true,
                secure: true,
            })
                .json({ currentUser });
        }
        catch {
            return res.status(500).json('Server Error!');
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// get all users
router.get('/getall', async (req, res) => {
    try {
        const user = await User.find();
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// update you'r refreshToken
router.post('/refreshToken', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken === null)
        return res.sendStatus(401);
    // if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    const usern = await User.findOne({ refreshToken });
    if (usern === null)
        return res.sendStatus(401); // check if refreshToken exist in data base
    if (process.env.SECRET_REFRESH_TOKEN)
        jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN, (err, user) => {
            if (err)
                return res.sendStatus(403);
            const data = {
                _id: usern._id,
                username: usern.username,
                name: usern.name,
                email: usern.email,
                createdAt: usern.createdAt,
                refreshToken,
            };
            const accessToken = generateAccessToken(data);
            return res
                .cookie('SSID', accessToken, {
                sameSite: 'strict',
                path: '/',
                expires: new Date(new Date().getFullYear() + 100),
                httpOnly: true,
                secure: true,
            })
                .json({ accessToken });
        });
});
// login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
        return res.status(404).json("Canno't Find User");
    const { name, email, _id, createdAt } = user;
    try {
        if (await bcrypt.compare(password, user.password)) {
            let refreshToken = '';
            if (process.env.SECRET_REFRESH_TOKEN)
                refreshToken = jwt.sign(user, process.env.SECRET_REFRESH_TOKEN);
            await User.updateOne({ username }, { $set: { refreshToken } });
            const currentUser = {
                _id,
                username,
                name,
                email,
                createdAt,
                refreshToken,
            };
            return res
                .cookie('SSID', generateAccessToken(user), {
                sameSite: 'strict',
                path: '/',
                expires: new Date(new Date().getFullYear() + 100),
                httpOnly: true,
                secure: true,
            })
                .json({ currentUser });
        }
        return res.json({
            message: 'Wrong Password. Please try again',
            currentUser: null,
        });
    }
    catch {
        return res.status(500).send('Server Error!');
    }
});
// delete refresh token / logout
router.delete('/logout', authenticateToken, (req, res) => {
    User.updateOne({ username: req.user.username }, { $set: { refreshToken: null } });
    return res.sendStatus(204).clearCookie('SSID').json({ currentUser: null });
});
// deleting one User
router.delete('/delete', authenticateToken, async (req, res) => {
    const { username, password, userId } = req.body;
    if (req.user.username === username) {
        const usern = await User.findOne({ username });
        if (usern === null)
            return res.status(404).json('Cannot find user');
        if (await bcrypt.compare(password, usern.password)) {
            try {
                // const removeUser = await User.deleteOne({_id: req.params.UserId})
                const removedUser = await User.remove({ _id: userId });
                return res.json({ removedUser });
            }
            catch (error) {
                return res.status(500).json({ message: error.message });
            }
        }
        else {
            return res.status(401).json({ message: 'wrong password' });
        }
    }
    else {
        return res.status(403).json({ message: 'trying to delete wrong user' });
    }
});
export default router;
