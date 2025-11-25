// Payout Controller
import { payoutService } from './payoutService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await payoutService.createPayout(req.body, userId, roleCode, roleName);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getAllPayouts = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await payoutService.getAllPayouts(userId, roleCode, roleName);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getPayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await payoutService.getPayoutById(id, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await payoutService.updatePayoutStatus(id, status, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

