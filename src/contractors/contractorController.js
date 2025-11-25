// Contractor Controller
import { contractorService } from './contractorService.js';
import { contractorProfileService } from './contractorProfileService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const getAllContractors = async (req, res) => {
  try {
    const result = await contractorService.getAllContractors(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await contractorService.getContractorById(id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateContractor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const result = await contractorService.updateContractor(id, req.body, userId, roleCode);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const searchContractors = async (req, res) => {
  try {
    const result = await contractorService.searchContractors(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getContractorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await contractorProfileService.getContractorProfileByUserId(userId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const upsertContractorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await contractorProfileService.upsertContractorProfile(userId, req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified, license_verified } = req.body; // Support both verified and license_verified
    const adminUserId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;

    // Pass both verified and license_verified to service
    const result = await contractorProfileService.updateVerificationStatus(
      userId, 
      verified, 
      adminUserId, 
      roleCode,
      license_verified
    );
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

