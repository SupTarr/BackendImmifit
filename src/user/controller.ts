import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import User, { IUser } from '../models/userModel.js';
import Profile, { IProfile } from '../models/profileModel.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const userIdValidation = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
];

const profileValidation = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString().withMessage('Last name must be a string'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('goal').optional().isString().withMessage('Goal must be a string'),
];

// Get user by ID
router.get('/:userId', userIdValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { userId } = req.params;
  try {
    const user: IUser | null = await User.findOne({ userId: userId })
      .select('-password -refreshToken -roles')
      .exec();

    if (!user) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'User not found' });
    }

    return res.status(200).json({ status: 'SUCCESS', data: user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch user.',
    });
  }
});

// Update or create user profile
router.put('/:userId/profile', [...userIdValidation, ...profileValidation], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { userId } = req.params;
  const profileData = req.body;

  if (Object.keys(profileData).length === 0) {
    return res.status(400).json({
      status: 'BAD_REQUEST',
      message: 'Request body cannot be empty.',
    });
  }

  try {
    const userExists = await User.exists({ userId: userId });
    if (!userExists) {
      return res.status(404).json({
        status: 'NOT_FOUND',
        message: `User with ID '${userId}' not found. Cannot update profile.`,
      });
    }

    const updatePayload: Partial<IProfile> = { ...profileData };
    let unsetPayload: { [key: string]: any } = {};
    const height = profileData.height;
    const weight = profileData.weight;

    if (height !== undefined && weight !== undefined && height > 0) {
      const heightInMeters = height / 100;
      updatePayload.bmi = parseFloat(
        (weight / (heightInMeters * heightInMeters)).toFixed(2),
      );
    } else {
      if (
        profileData.hasOwnProperty('height') ||
        profileData.hasOwnProperty('weight')
      ) {
        unsetPayload['bmi'] = '';
      }
    }

    const updateOperation: any = {
      $set: updatePayload,
      $setOnInsert: {
        profileId: uuidv4(),
        userId: userId,
      },
    };

    if (Object.keys(unsetPayload).length > 0) {
      updateOperation.$unset = unsetPayload;
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: userId },
      updateOperation,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).select('-__v');

    if (!updatedProfile) {
      return res.status(500).json({
        status: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update or create profile.',
      });
    }

    const {
      _id,
      userId: profileUserId,
      profileId,
      ...profileToReturn
    } = updatedProfile.toObject();
    return res.status(200).json({ status: 'SUCCESS', data: profileToReturn });
  } catch (error: any) {
    console.error('Error adding/updating user profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        message: 'Profile data validation failed.',
        details: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'CONFLICT',
        message: 'Profile creation conflict, please retry.',
      });
    }
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update profile.',
    });
  }
});

export default router;
