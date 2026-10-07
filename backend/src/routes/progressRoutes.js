import { Router } from 'express';
import * as progress from '../controllers/progressController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { commentSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize('STUDENT'), upload.single('file'), progress.submit);
router.get('/team/:id', progress.listTeam);
router.get('/:id', progress.get);
router.post('/:id/comments', authorize('INSTRUCTOR', 'ADMIN'), validate(commentSchema), progress.comment);

export default router;
