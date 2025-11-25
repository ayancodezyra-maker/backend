// Bid Controller
import { bidService } from './bidService.js';
import { bidSubmissionService } from './bidSubmissionService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createBid = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await bidService.createBid(req.body, userId, roleCode, roleName);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getAllBids = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await bidService.getAllBids(userId, roleCode, roleName);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getBidById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await bidService.getBidById(id, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateBid = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await bidService.updateBid(id, req.body, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const submitBid = async (req, res) => {
  try {
    // Validate user ID exists
    if (!req.user || !req.user.id) {
      return res.status(401).json(formatResponse(false, 'Unauthorized: User ID missing', null));
    }

    const { bidId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    // Note: Permission check for canCreateBids is handled by the service
    // This allows GC, Project Manager, Admin, and other roles with canCreateBids permission

    // Validate contractor_id matches user if provided
    if (req.body.contractor_id && req.body.contractor_id !== userId) {
      return res.status(403).json(formatResponse(false, "You cannot submit another contractor's bid submission", null));
    }

    // Ensure created_by is never taken from body - always use req.user.id
    const { created_by, ...bodyWithoutCreatedBy } = req.body;
    
    const result = await bidSubmissionService.submitBid(bidId, bodyWithoutCreatedBy, userId, roleCode, roleName);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getBidSubmissions = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await bidSubmissionService.getBidSubmissions(bidId, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(formatResponse(false, 'Unauthorized: User ID missing', null));
    }
    const userId = req.user.id;
    const result = await bidSubmissionService.getUserSubmissions(userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateBidSubmission = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(formatResponse(false, 'Unauthorized: User ID missing', null));
    }
    const { submissionId } = req.params;
    const userId = req.user.id;
    
    // Never allow created_by to be updated
    const { created_by, ...bodyWithoutCreatedBy } = req.body;
    
    const result = await bidSubmissionService.updateBidSubmission(submissionId, bodyWithoutCreatedBy, userId);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getBidSubmissionById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(formatResponse(false, 'Unauthorized: User ID missing', null));
    }
    const { submissionId } = req.params;
    const userId = req.user.id;
    const result = await bidSubmissionService.getBidSubmissionById(submissionId, userId);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

