// Milestone Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createMilestone,
  getProjectMilestones,
  updateMilestone,
  submitMilestone,
  approveMilestone,
} from './milestoneController.js';

const router = express.Router();

router.post('/projects/:projectId', auth, createMilestone);
router.get('/projects/:projectId', auth, getProjectMilestones);
router.put('/:id', auth, updateMilestone);
router.post('/:id/submit', auth, submitMilestone);
router.post('/:id/approve', auth, guard('canEditAllProjects'), approveMilestone);

export default router;

