import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../configs/config.js';
import User from '../models/userModel.js';

interface JwtPayload {
  userId: string;
  roles: number[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roles: number[];
      };
    }
  }
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret) as JwtPayload;
    const user = await User.findOne({ userId: decoded.userId }).exec();

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      userId: decoded.userId,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
};

export const verifyRoles = (...allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rolesArray = [...allowedRoles];
    const result = req.user.roles
      .map((role) => rolesArray.includes(role))
      .find((val) => val === true);

    if (!result) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}; 