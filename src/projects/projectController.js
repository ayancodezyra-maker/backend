// Project Controller
import { projectService } from './projectService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await projectService.createProject(req.body, userId);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await projectService.getProjectById(id, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await projectService.getUserProjects(userId, roleCode, roleName);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    // Don't add updated_at - let database handle it if column exists
    const updateData = { ...req.body };

    const result = await projectService.updateProject(id, updateData, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;

    const result = await projectService.deleteProject(id, userId, roleCode);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

