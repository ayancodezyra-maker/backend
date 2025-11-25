// Job Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
} from './jobController.js';

const router = express.Router();

router.post('/', auth, guard('canPostJobs'), createJob);
router.get('/', auth, getAllJobs);
router.get('/:id', auth, getJobById);
router.put('/:id', auth, guard('canPostJobs'), updateJob);
router.post('/:jobId/apply', auth, applyToJob);
router.get('/:jobId/applications', auth, guard('canManageApplications'), getJobApplications);
router.put('/applications/:applicationId/status', auth, guard('canManageApplications'), updateApplicationStatus);

export default router;

