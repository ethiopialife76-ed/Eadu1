import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { departmentSchema } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/users', admin.users);
router.patch('/users/:id/deactivate', admin.deactivate);
router.patch('/users/:id/activate', admin.activate);
router.delete('/users/:id', admin.removeUser);
router.patch('/users/:id/role', admin.setRole);
router.patch('/users/:id/industry', admin.approveIndustry);
router.get('/departments', admin.departments);
router.post('/departments', validate(departmentSchema), admin.createDepartment);
router.get('/stats', admin.stats);

export default router;
