import { Router } from 'express';
import * as supervisor from '../controllers/supervisorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supervisorRequestSchema, supervisorDecisionSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', supervisor.list);
router.post('/request', authorize('STUDENT'), validate(supervisorRequestSchema), supervisor.request);
router.get('/requests', authorize('INSTRUCTOR', 'ADMIN'), supervisor.incoming);
router.patch('/requests/:id', authorize('INSTRUCTOR', 'ADMIN'), validate(supervisorDecisionSchema), supervisor.decide);
router.post('/assign', authorize('ADMIN'), supervisor.assign);

export default router;
