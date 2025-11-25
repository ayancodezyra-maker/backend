// Review Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createReview,
  getContractorReviews,
  getReviewById,
  addReviewResponse,
} from './reviewController.js';

const router = express.Router();

router.post('/', auth, createReview);
router.get('/contractors/:contractorId', auth, getContractorReviews);
router.get('/:id', auth, getReviewById);
router.post('/:id/response', auth, addReviewResponse);

export default router;

