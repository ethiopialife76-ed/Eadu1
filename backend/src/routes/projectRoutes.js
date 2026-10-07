import { Router } from 'express';
import * as project from '../controllers/projectController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { projectSchema, statusSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', project.list);
router.post('/', authorize('STUDENT', 'INDUSTRY', 'ADMIN'), validate(projectSchema), project.create);
router.get('/:id', project.get);
router.patch('/:id', validate(projectSchema.partial()), project.update);
router.delete('/:id', project.remove);
router.patch('/:id/status', authorize('ADMIN'), validate(statusSchema), project.status);

export default router;
