import { Router } from 'express';
import * as team from '../controllers/teamController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { teamCreateSchema, joinDecisionSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize('STUDENT'), validate(teamCreateSchema), team.create);
router.get('/:id', team.get);
router.post('/:id/join', authorize('STUDENT'), team.join);
router.patch('/:id/requests/:requestId', validate(joinDecisionSchema), team.decideJoin);
router.delete('/:id/leave', authorize('STUDENT'), team.leave);
router.delete('/:id/members/:studentId', team.removeMember);
router.patch('/:id/approve', authorize('INSTRUCTOR', 'ADMIN'), team.approve);
router.get('/:id/members', team.members);
router.get('/:id/messages', team.messages);

export default router;
