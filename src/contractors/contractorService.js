// Contractor Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const contractorService = {
  /**
   * Get all contractors
   */
  async getAllContractors(filters = {}) {
    // Contractors are profiles with contractor roles (GC, SUB, TS, CONTRACTOR)
    // Query profiles table with contractor_profiles join
    let query = supabase
      .from('profiles')
      .select('*, contractor_profiles(*)')
      .in('role_code', ['GC', 'SUB', 'TS', 'CONTRACTOR']);

    // Note: trade_type and availability_status filters are not directly supported
    // as these columns may not exist in the schema
    // If needed, filter in application code after fetching

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Apply filters in memory if needed
    let filteredData = data || [];
    
    // Filter by trade_type if provided (check in contractor_profiles.specialties array)
    if (filters.trade_type && filteredData.length > 0) {
      filteredData = filteredData.filter(contractor => {
        const specialties = contractor.contractor_profiles?.specialties || [];
        return Array.isArray(specialties) && specialties.includes(filters.trade_type);
      });
    }

    // Filter by availability_status if provided (if column exists)
    // Note: availability_status column might not exist - skip for now

    return formatResponse(true, 'Contractors retrieved', filteredData);
  },

  /**
   * Get contractor by ID
   */
  async getContractorById(contractorId) {
    // Query profiles table directly (contractors are profiles with contractor roles)
    let { data: contractor, error } = await supabase
      .from('profiles')
      .select('*, contractor_profiles(*)')
      .eq('id', contractorId)
      .single();

    // If not found, try without contractor_profiles join (profile might not have contractor profile yet)
    if (error && error.code === 'PGRST116') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', contractorId)
        .single();
      
      if (!profileError && profile) {
        contractor = {
          ...profile,
          contractor_profiles: null, // No contractor profile yet
        };
        error = null;
      }
    }

    if (error || !contractor) {
      return formatResponse(false, 'Contractor not found', null);
    }

    return formatResponse(true, 'Contractor retrieved', contractor);
  },

  /**
   * Update contractor (contractor is a profile)
   */
  async updateContractor(contractorId, updates, userId, roleCode) {
    // Check if user is admin - use roleCode from token if provided, otherwise query
    let isAdmin = false;
    if (roleCode) {
      isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode.toUpperCase());
    } else {
      // Fallback: query database
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role_code')
        .eq('id', userId)
        .single();
      isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(userProfile?.role_code?.toUpperCase());
    }

    // Allow update if user owns the profile OR is admin
    if (contractorId !== userId && !isAdmin) {
      return formatResponse(false, 'Permission denied', null);
    }

    // Only allow updating specific fields
    const allowedFields = ['full_name', 'phone', 'avatar_url'];
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return formatResponse(false, 'No valid fields to update', null);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', contractorId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Contractor updated successfully', data);
  },

  /**
   * Search contractors
   */
  async searchContractors(searchParams) {
    let query = supabase
      .from('profiles')
      .select('*, contractor_profiles(*)')
      .in('role_code', ['GC', 'SUB', 'TS']);

    // Note: Additional filtering can be added based on contractor_profiles fields

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Contractors retrieved', data || []);
  },
};

