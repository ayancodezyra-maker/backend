// Dispute Controller
import { disputeService } from './disputeService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const fileDispute = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await disputeService.fileDispute(req.body, userId);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getProjectDisputes = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const result = await disputeService.getProjectDisputes(projectId, userId);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const result = await disputeService.getDisputeById(id, userId, roleCode);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateDisputeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const result = await disputeService.updateDisputeStatus(id, req.body, userId, roleCode);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const assignDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const result = await disputeService.assignDispute(id, adminId, userId, roleCode);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

