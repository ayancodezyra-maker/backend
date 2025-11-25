// Review Controller
import { reviewService } from './reviewService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await reviewService.createReview(req.body, userId);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getContractorReviews = async (req, res) => {
  try {
    const { contractorId } = req.params;
    const result = await reviewService.getContractorReviews(contractorId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await reviewService.getReviewById(id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const addReviewResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user.id;
    const result = await reviewService.addReviewResponse(id, response, userId);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

