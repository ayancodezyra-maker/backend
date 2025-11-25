// Payment Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  getProjectPayments,
} from './paymentController.js';

const router = express.Router();

router.post('/', auth, guard('canManagePayments'), createPayment);
router.get('/', auth, guard('canManagePayments'), getAllPayments);
router.get('/:id', auth, getPaymentById);
router.put('/:id', auth, guard('canManagePayments'), updatePayment);
router.get('/projects/:projectId', auth, getProjectPayments);

export default router;

