import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, passwordSchema, profileSchema } from '../validators/schemas.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/forgot-password', authLimiter, auth.forgot);
router.post('/reset-password', authLimiter, auth.reset);
router.get('/me', authenticate, auth.me);
router.patch('/profile', authenticate, validate(profileSchema), auth.updateProfile);
router.patch('/password', authenticate, validate(passwordSchema), auth.changePassword);

export default router;
