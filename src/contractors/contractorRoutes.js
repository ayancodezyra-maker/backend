// Contractor Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  getAllContractors,
  getContractorById,
  updateContractor,
  searchContractors,
  getContractorProfile,
  upsertContractorProfile,
  updateVerificationStatus,
} from './contractorController.js';

const router = express.Router();

router.get('/', auth, getAllContractors);
router.get('/search', auth, searchContractors);
router.get('/:id', auth, getContractorById);
router.put('/:id', auth, updateContractor);
router.get('/profiles/:userId', auth, getContractorProfile);
router.post('/profiles', auth, upsertContractorProfile);
router.put('/profiles/:userId/verify', auth, guard('canManageUsers'), updateVerificationStatus);

export default router;

