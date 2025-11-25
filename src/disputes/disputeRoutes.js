// Dispute Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  fileDispute,
  getProjectDisputes,
  getDisputeById,
  updateDisputeStatus,
  assignDispute,
} from './disputeController.js';

const router = express.Router();

router.post('/', auth, fileDispute);
router.get('/projects/:projectId', auth, getProjectDisputes);
router.get('/project/:projectId', auth, getProjectDisputes); // Support both routes
router.get('/:id', auth, getDisputeById);
router.put('/:id/status', auth, guard('canManageUsers'), updateDisputeStatus);
router.put('/:id/assign', auth, guard('canManageUsers'), assignDispute);

export default router;

