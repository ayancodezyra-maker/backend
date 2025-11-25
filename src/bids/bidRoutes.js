// Bid Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createBid,
  getAllBids,
  getBidById,
  updateBid,
  submitBid,
  getBidSubmissions,
  getUserSubmissions,
  updateBidSubmission,
  getBidSubmissionById,
} from './bidController.js';

const router = express.Router();

// Specific routes first (before parameterized routes)
router.post('/', auth, guard('canCreateBids'), createBid);
router.get('/', auth, getAllBids);
router.get('/submissions/my', auth, getUserSubmissions);
router.get('/submissions/:submissionId', auth, getBidSubmissionById);
router.put('/submissions/:submissionId', auth, updateBidSubmission);
router.post('/:bidId/submit', auth, guard('canCreateBids'), submitBid);
router.post('/:bidId/submissions', auth, guard('canCreateBids'), submitBid); // New route matching requirement
router.get('/:bidId/submissions', auth, guard('canViewAllBids'), getBidSubmissions);

// Parameterized routes last
router.get('/:id', auth, getBidById);
router.put('/:id', auth, guard('canCreateBids'), updateBid);

export default router;

