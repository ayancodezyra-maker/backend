// Contractor Profile Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const contractorProfileService = {
  /**
   * Get contractor profile by user ID
   */
  async getContractorProfileByUserId(userId) {
    // Try contractor_profiles first
    let { data: profile, error } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If not found, return empty profile (profile might not exist yet)
    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist - return empty object
      return formatResponse(true, 'Contractor profile retrieved', {
        user_id: userId,
        company_name: null,
        license_number: null,
        verified: false,
      });
    }

    if (error) {
      return formatResponse(false, 'Contractor profile not found', null);
    }

    return formatResponse(true, 'Contractor profile retrieved', profile);
  },

  /**
   * Create or update contractor profile
   */
  async upsertContractorProfile(userId, data) {
    const {
      company_name,
      license_number,
      insurance_amount,
      years_in_business,
      specialties,
      portfolio,
      certifications,
    } = data;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const profileData = {
      user_id: userId,
      company_name,
      license_number,
      insurance_amount,
      years_in_business,
      specialties: specialties || [],
      portfolio: portfolio || [],
      certifications: certifications || [],
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('contractor_profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return formatResponse(false, error.message, null);
      }
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('contractor_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return formatResponse(false, error.message, null);
      }
      result = data;
    }

    return formatResponse(true, 'Contractor profile saved successfully', result);
  },

  /**
   * Update contractor verification status
   */
  async updateVerificationStatus(userId, verified, userIdUpdating, roleCode, licenseVerified) {
    // Only admins can verify contractors
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    if (!isAdmin) {
      return formatResponse(false, 'Permission denied: Only admins can verify contractors', null);
    }

    // Build update data - only use columns that exist in actual database
    // Actual schema has: license_verified, insurance_verified (but NOT verified)
    const updateData = {};
    
    // Use license_verified (exists in actual database)
    // If verified is provided, use it for license_verified
    if (licenseVerified !== undefined) {
      updateData.license_verified = licenseVerified;
    } else if (verified !== undefined) {
      // Map verified to license_verified if license_verified not provided
      updateData.license_verified = verified;
    }

    // Try to update
    let { data, error } = await supabase
      .from('contractor_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    if (!data) {
      return formatResponse(false, 'Contractor profile not found', null);
    }

    return formatResponse(true, 'Verification status updated', data);
  },
};

