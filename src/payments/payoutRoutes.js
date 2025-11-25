// Payout Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createPayout,
  getAllPayouts,
  getPayoutById,
  updatePayoutStatus,
} from './payoutController.js';

const router = express.Router();

router.post('/', auth, guard('canManagePayments'), createPayout);
router.get('/', auth, guard('canManagePayments'), getAllPayouts);
router.get('/:id', auth, getPayoutById);
router.put('/:id/status', auth, guard('canManagePayments'), updatePayoutStatus);

export default router;

