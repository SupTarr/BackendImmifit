import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../configs/config.js';
import User, { IUser } from '../models/userModel.js';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Login route
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { email, password } = req.body;
  const foundUser: IUser | null = await User.findOne({ email: email })
    .select('+password +refreshToken')
    .exec();

  if (!foundUser || !foundUser.password) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      message: 'Invalid email or password',
    });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    const accessToken = jwt.sign(
      {
        userId: foundUser.userId,
        roles: foundUser.roles,
      },
      config.accessTokenSecret,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { userId: foundUser.userId },
      config.refreshTokenSecret,
      { expiresIn: '1d' },
    );

    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'strict',
    });

    return res.status(200).json({ status: 'SUCCESS', body: { accessToken } });
  }

  return res.status(400).json({
    status: 'INVALID_REQUEST',
    message: 'Invalid email or password',
  });
});

// Register route
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { email, password } = req.body;
  const duplicateEmail = await User.findOne({ email: email }).exec();
  if (duplicateEmail) {
    return res.status(409).json({ status: 'INVALID_REQUEST', message: 'Email already exists' });
  }

  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      userId: uuidv4(),
      email: email,
      password: hashedPwd,
    } as Partial<IUser>);

    return res.status(200).json({
      status: 'SUCCESS',
      body: { userId: newUser.userId },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register user',
    });
  }
});

// Refresh token route
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jwt;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      message: 'Refresh token missing or invalid',
    });
  }

  try {
    const foundUser: IUser | null = await User.findOne({
      refreshToken: refreshToken,
    }).exec();

    if (!foundUser) {
      res.clearCookie('jwt');
      return res.status(400).json({ status: 'INVALID_REQUEST', message: 'Invalid refresh token' });
    }

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as { userId: string };

    if (foundUser.userId !== decoded.userId) {
      res.clearCookie('jwt');
      return res.status(400).json({ status: 'INVALID_REQUEST', message: 'Refresh token mismatch' });
    }

    const roles = Object.values(foundUser.roles || {}).filter(
      (role): role is number => typeof role === 'number',
    );
    const accessToken = jwt.sign(
      { userId: foundUser.userId, roles: roles },
      config.accessTokenSecret,
      { expiresIn: '15m' },
    );

    return res.status(200).json({ status: 'SUCCESS', body: { accessToken } });
  } catch (error) {
    console.error('Error handling refresh token:', error);
    res.clearCookie('jwt');
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        message: 'Invalid or expired refresh token',
      });
    }

    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to refresh token',
    });
  }
});

// Logout route
router.get('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jwt;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(200).json({ status: 'SUCCESS' });
  }

  try {
    await User.updateOne(
      { refreshToken: refreshToken },
      { $unset: { refreshToken: 1 } },
    );

    res.clearCookie('jwt');
    return res.status(200).json({ status: 'SUCCESS' });
  } catch (error) {
    console.error('Logout error:', error);
    res.clearCookie('jwt');
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error during logout',
    });
  }
});

export default router;
