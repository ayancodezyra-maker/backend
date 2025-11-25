// Milestone Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const milestoneService = {
  /**
   * Create milestone
   */
  async createMilestone(projectId, data, userId, roleCode, roleName) {
    // Check if user can edit the project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return formatResponse(false, 'Project not found', null);
    }

    const canEditAll = hasPermission(roleCode, roleName, 'canEditAllProjects');
    if (!canEditAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    // Extract milestone fields
    const {
      title,
      description,
      due_date,
      payment_amount,
      order_number,
      status,
    } = data;

    // Set defaults for required fields
    const milestoneData = {
      project_id: projectId,
      title: title || 'Milestone',
      description: description || null,
      due_date: due_date || null,
      payment_amount: payment_amount || null,
      order_number: order_number || 1,
      status: status || 'not_started',
    };

    const { data: milestone, error } = await supabase
      .from('project_milestones')
      .insert(milestoneData)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Milestone created successfully', milestone);
  },

  /**
   * Get milestones for project
   */
  async getProjectMilestones(projectId, userId, roleCode, roleName) {
    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return formatResponse(false, 'Project not found', null);
    }

    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Milestones retrieved', data || []);
  },

  /**
   * Update milestone
   */
  async updateMilestone(milestoneId, updates, userId, roleCode, roleName) {
    // Get milestone with project info
    const { data: milestone, error: fetchError } = await supabase
      .from('project_milestones')
      .select('*, projects!inner(owner_id, contractor_id)')
      .eq('id', milestoneId)
      .single();

    if (fetchError || !milestone) {
      return formatResponse(false, 'Milestone not found', null);
    }

    const project = milestone.projects;
    const canEditAll = hasPermission(roleCode, roleName, 'canEditAllProjects');
    if (!canEditAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Milestone updated successfully', data);
  },

  /**
   * Submit milestone for approval
   */
  async submitMilestone(milestoneId, userId) {
    const { data, error } = await supabase
      .from('project_milestones')
      .update({
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Milestone submitted for review', data);
  },

  /**
   * Approve milestone
   */
  async approveMilestone(milestoneId, userId, roleCode, roleName) {
    // Check permission
    const canEditAll = hasPermission(roleCode, roleName, 'canEditAllProjects');
    if (!canEditAll) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Milestone approved', data);
  },
};

