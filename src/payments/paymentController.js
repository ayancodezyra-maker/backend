// Payment Controller
import { paymentService } from './paymentService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await paymentService.createPayment(req.body, userId, roleCode, roleName);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await paymentService.getAllPayments(userId, roleCode, roleName);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await paymentService.getPaymentById(id, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await paymentService.updatePayment(id, req.body, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getProjectPayments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await paymentService.getProjectPayments(projectId, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

