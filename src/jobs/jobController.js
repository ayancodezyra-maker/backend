// Job Controller
import { jobService } from './jobService.js';
import { jobApplicationService } from './jobApplicationService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    // Remove created_by from body if present (never trust user input for this)
    const { created_by, ...jobData } = req.body;

    // Ensure created_by is always set from authenticated user
    const finalJobData = {
      ...jobData,
      created_by: userId,
      application_count: 0,
      status: jobData.status || 'open',
    };

    const result = await jobService.createJob(finalJobData, userId, roleCode, roleName);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const result = await jobService.getAllJobs(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await jobService.getJobById(id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await jobService.updateJob(id, req.body, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const result = await jobApplicationService.applyToJob(jobId, req.body, userId);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await jobApplicationService.getJobApplications(jobId, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;

    const result = await jobApplicationService.updateApplicationStatus(applicationId, status, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

