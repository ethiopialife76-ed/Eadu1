import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as ai from '../controllers/aiController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { voiceSchema } from '../validators/schemas.js';
import * as departmentRepo from '../repositories/departmentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/departments', asyncHandler(async (req, res) => {
  const data = await departmentRepo.list();
  res.json({ success: true, data });
}));

router.get('/notifications', authenticate, admin.notifications);
router.patch('/notifications/:id/read', authenticate, admin.markRead);
router.patch('/notifications/read-all', authenticate, admin.markAllRead);
router.post('/ai/voice', optionalAuth, validate(voiceSchema), ai.voice);

export default router;
