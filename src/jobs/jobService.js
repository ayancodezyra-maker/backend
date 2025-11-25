// Job Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const jobService = {
  /**
   * Create a new job
   */
  async createJob(data, userId, roleCode, roleName) {
    // Admin roles can always create jobs
    const adminRoles = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'];
    const isAdmin = adminRoles.includes(roleCode?.toUpperCase());
    
    // Check permission for non-admin users
    if (!isAdmin && !hasPermission(roleCode, roleName, 'canPostJobs')) {
      return formatResponse(false, 'Permission denied: canPostJobs', null);
    }

    const { title, description, location, trade_type, budget_min, budget_max, start_date, end_date, requirements, images, created_by, application_count, status } = data;

    if (!title || !description || !location || !trade_type) {
      return formatResponse(false, 'Missing required fields', null);
    }

    // Ensure created_by is set (from controller, but double-check here)
    const finalCreatedBy = created_by || userId;

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title,
        description,
        location,
        trade_type,
        budget_min,
        budget_max,
        start_date,
        end_date,
        project_manager_id: userId,
        created_by: finalCreatedBy, // Always set from authenticated user
        application_count: application_count !== undefined ? application_count : 0,
        requirements: requirements || {},
        images: images || [],
        status: status || 'open',
      })
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Job created successfully', job);
  },

  /**
   * Get all jobs
   */
  async getAllJobs(filters = {}) {
    let query = supabase.from('jobs').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.trade_type) {
      query = query.eq('trade_type', filters.trade_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Jobs retrieved', data || []);
  },

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return formatResponse(false, 'Job not found', null);
    }

    return formatResponse(true, 'Job retrieved', job);
  },

  /**
   * Update job
   */
  async updateJob(jobId, updates, userId, roleCode, roleName) {
    // Get existing job
    const { data: existing, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !existing) {
      return formatResponse(false, 'Job not found', null);
    }

    // Check permission: can manage applications OR is job poster
    const canManage = hasPermission(roleCode, roleName, 'canManageApplications');
    if (!canManage && existing.project_manager_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Job updated successfully', data);
  },
};

