import { Router, Request, Response } from 'express';
import { cloudinary } from '../configs/cloudinary.config.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Activities, { IActivities, IImage } from '../models/activitiesModel.js';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation middleware
const activityIdValidation = [
  param('activityId').isUUID().withMessage('Invalid activity ID format'),
];

const userIdValidation = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
];

const createActivityValidation = [
  body('userId').isUUID().withMessage('Invalid user ID format'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('title').isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('type').isString().withMessage('Type must be a string'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('calories').isNumeric().withMessage('Calories must be a number'),
];

const editActivityValidation = [
  param('activityId').isUUID().withMessage('Invalid activity ID format'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('type').optional().isString().withMessage('Type must be a string'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('calories').optional().isNumeric().withMessage('Calories must be a number'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
];

async function uploadToCloudinary(file: Express.Multer.File): Promise<IImage | null> {
  try {
    const base64String = file.buffer.toString('base64');
    const fileUri = `data:${file.mimetype};base64,${base64String}`;
    const uploadResponse = await cloudinary.uploader.upload(fileUri, {
      upload_preset: 'immifit',
      public_id: `immifit/${uuidv4()}`,
    });

    return {
      name: file.originalname,
      id: uploadResponse.public_id,
      url: uploadResponse.secure_url,
      contentType: file.mimetype,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

// Get all activities
router.get('/', async (req: Request, res: Response) => {
  try {
    const activities = await Activities.find().sort({ date: -1 });
    return res.status(200).json({ status: 'SUCCESS', data: activities });
  } catch (error) {
    console.error('Error fetching all activities:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Error fetching activities',
    });
  }
});

// Get activities by user ID
router.get('/user/:userId', userIdValidation, async (req: Request, res: Response) => {
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
    const userExists = await User.exists({ userId: userId });
    if (!userExists) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'User not found' });
    }

    const activities = await Activities.find({ user_id: userId }).sort({
      date: -1,
    });
    return res.status(200).json({ status: 'SUCCESS', data: activities });
  } catch (error) {
    console.error('Error fetching activities by user ID:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Error fetching activities',
    });
  }
});

// Get activity by ID
router.get('/:activityId', activityIdValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { activityId } = req.params;
  try {
    const activity = await Activities.findOne({ activityId });
    if (!activity) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'Activity not found' });
    }
    return res.status(200).json({ status: 'SUCCESS', data: activity });
  } catch (error) {
    console.error('Error fetching activity by ID:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Error fetching activity',
    });
  }
});

// Create new activity
router.post('/', upload.single('img'), createActivityValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { userId, date, ...activityData } = req.body;
  const img = req.file;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'User specified not found.' });
    }

    if (!img) {
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        message: 'Image is required',
      });
    }

    const uploadedImgData = await uploadToCloudinary(img);
    if (!uploadedImgData) {
      return res.status(500).json({
        status: 'UPLOAD_FAILED',
        message: 'Failed to upload image to Cloudinary.',
      });
    }

    const newActivity = new Activities({
      ...activityData,
      activityId: uuidv4(),
      user_id: user.userId,
      img: uploadedImgData,
      date: new Date(date),
    });

    await newActivity.save();

    return res.status(201).json({ status: 'SUCCESS', data: newActivity });
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        message: 'Activity data validation failed.',
        details: error.message,
      });
    }
    console.error('Error creating activity:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Error creating activity',
    });
  }
});

// Update activity
router.put('/:activityId', upload.single('img'), editActivityValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors.array(),
    });
  }

  const { activityId } = req.params;
  const { date, ...updateData } = req.body;
  const img = req.file;

  if (Object.keys(updateData).length === 0 && !img) {
    return res.status(400).json({ status: 'BAD_REQUEST', message: 'No update data provided.' });
  }

  try {
    const existingActivity = await Activities.findOne({ activityId });
    if (!existingActivity) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'Activity not found.' });
    }

    let uploadedImgData: IImage | null | undefined = undefined;

    if (img) {
      if (existingActivity.img && existingActivity.img.id) {
        try {
          await cloudinary.uploader.destroy(existingActivity.img.id);
        } catch (deleteError) {
          console.warn(
            'Cloudinary: Failed to delete old image during update:',
            deleteError,
          );
        }
      }

      uploadedImgData = await uploadToCloudinary(img);
      if (uploadedImgData === null) {
        return res.status(500).json({
          status: 'UPLOAD_FAILED',
          message: 'Failed to upload new image.',
        });
      }
    }

    const finalUpdateData: Partial<IActivities> = { ...updateData };
    if (uploadedImgData) {
      finalUpdateData.img = uploadedImgData;
    }
    if (date) {
      finalUpdateData.date = new Date(date);
    }

    const updatedActivity = await Activities.findOneAndUpdate(
      { activityId },
      { $set: finalUpdateData },
      { new: true, runValidators: true },
    );

    if (!updatedActivity) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'Activity not found after update attempt.' });
    }

    return res.status(200).json({ status: 'SUCCESS', data: updatedActivity });
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        message: 'Activity data validation failed.',
        details: error.message,
      });
    }
    console.error('Error updating activity:', error);
    return res.status(500).json({
      status: 'INTERNAL_SERVER_ERROR',
      message: 'Error updating activity',
    });
  }
});

export default router;
