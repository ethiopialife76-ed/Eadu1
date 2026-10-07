import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/AppError.js';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AuthenticationError('Missing access token');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department_id: true,
        is_active: true,
        industry_approved: true,
      },
    });

    if (!user || !user.is_active) throw new AuthenticationError('Account is inactive or not found');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid or expired token'));
    }
    next(err);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AuthorizationError());
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department_id: true,
        is_active: true,
        industry_approved: true,
      },
    });
    if (user?.is_active) req.user = user;
  } catch {
    // visitors can still use public AI help
  }
  next();
};
