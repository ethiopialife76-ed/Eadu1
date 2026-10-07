import { Router } from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import teamRoutes from './teamRoutes.js';
import supervisorRoutes from './supervisorRoutes.js';
import progressRoutes from './progressRoutes.js';
import adminRoutes from './adminRoutes.js';
import miscRoutes from './miscRoutes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/teams', teamRoutes);
router.use('/supervisors', supervisorRoutes);
router.use('/progress-reports', progressRoutes);
router.use('/admin', adminRoutes);
router.use('/', miscRoutes);

export default router;
