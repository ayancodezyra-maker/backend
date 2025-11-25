// Progress Update Controller
import { progressUpdateService } from './progressUpdateService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createProgressUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await progressUpdateService.createProgressUpdate(req.body, userId);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getProjectProgressUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await progressUpdateService.getProjectProgressUpdates(projectId, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getProgressUpdateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await progressUpdateService.getProgressUpdateById(id, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

