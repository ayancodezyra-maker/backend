// Dispute Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const disputeService = {
  /**
   * File a dispute
   */
  async fileDispute(data, userId) {
    const {
      project_id,
      milestone_id,
      dispute_type,
      description,
      reason, // Support both description and reason
      evidence,
      amount_disputed,
      desired_resolution,
    } = data;

    // Use description or reason
    const disputeDescription = description || reason;

    if (!project_id || !disputeDescription) {
      return formatResponse(false, 'Missing required fields: project_id, description (or reason)', null);
    }

    // Verify user is part of project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', project_id)
      .single();

    if (!project || (project.owner_id !== userId && project.contractor_id !== userId)) {
      return formatResponse(false, 'Permission denied: Only project participants can file disputes', null);
    }

    // Use actual disputes table schema: id, project_id, raised_by, reason, status, resolved_by, created_at
    // Only use columns that definitely exist
    const disputeData = {
      project_id,
      raised_by: userId, // Use raised_by (actual schema column)
      reason: disputeDescription, // Use reason field (actual schema)
      status: 'open', // Use 'open' (valid status)
    };

    // Note: dispute_type, description, evidence, amount_disputed, desired_resolution, milestone_id
    // do not exist in actual schema - don't include them

    // Try to insert
    let { data: dispute, error } = await supabase
      .from('disputes')
      .insert(disputeData)
      .select()
      .maybeSingle();

    // If error, return it
    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Dispute filed successfully', dispute);
  },

  /**
   * Get disputes for a project
   */
  async getProjectDisputes(projectId, userId) {
    // Verify user is part of project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', projectId)
      .single();

    if (!project || (project.owner_id !== userId && project.contractor_id !== userId)) {
      return formatResponse(false, 'Permission denied', null);
    }

    // Fix SQL join - use simpler select
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Disputes retrieved', data || []);
  },

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId, userId, roleCode) {
    // Use simpler select without foreign key joins
    const { data: dispute, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .maybeSingle();

    if (error || !dispute) {
      return formatResponse(false, 'Dispute not found', null);
    }

    // Get project to check access
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', dispute.project_id)
      .single();

    // Check access: project participant or admin
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    if (!isAdmin && project && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    return formatResponse(true, 'Dispute retrieved', dispute);
  },

  /**
   * Update dispute status (admin only)
   */
  async updateDisputeStatus(disputeId, updates, userId, roleCode) {
    // Only admins can update dispute status
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    if (!isAdmin) {
      return formatResponse(false, 'Permission denied: Admin only', null);
    }

    // Only update fields that exist: status, resolved_by
    const updateData = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.resolved_by) updateData.resolved_by = updates.resolved_by;
    // Note: updated_at doesn't exist in schema

    const { data, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .maybeSingle();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Dispute updated successfully', data);
  },

  /**
   * Assign dispute to admin
   */
  async assignDispute(disputeId, adminId, userId, roleCode) {
    // Only admins can assign disputes
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    if (!isAdmin) {
      return formatResponse(false, 'Permission denied: Admin only', null);
    }

    // Note: admin_assigned and updated_at columns don't exist in actual schema
    // Use resolved_by to track assignment instead
    const { data, error } = await supabase
      .from('disputes')
      .update({
        resolved_by: adminId, // Use resolved_by as assignment tracking
      })
      .eq('id', disputeId)
      .select()
      .maybeSingle();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Dispute assigned successfully', data);
  },
};

