// Project Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';
import { randomUUID } from 'crypto';

export const projectService = {
  /**
   * Create a new project
   */
  async createProject(data, userId) {
    const { owner_id, contractor_id, title, description, total_amount, budget, status } = data;

    // Support both total_amount and budget fields - use budget (actual column name)
    const projectAmount = budget || total_amount;

    // Auto-set owner_id from userId if not provided
    const finalOwnerId = owner_id || userId;

    if (!finalOwnerId || !contractor_id || !title) {
      return formatResponse(false, 'Missing required fields: contractor_id, title', null);
    }

    // Build insert data - only include fields that exist
    const insertData = {
      owner_id: finalOwnerId, // Always set owner_id (required, NOT NULL)
      contractor_id: contractor_id || null,
      title,
      description: description || null,
      budget: projectAmount || null, // Use budget column (actual schema)
      status: status || 'open',
    };

    // Only add created_by if it's not null (some schemas might not have it or it might be nullable)
    if (userId) {
      insertData.created_by = userId;
    }

    // If database has project_id column (separate from id), try to set it
    // Generate UUID for project_id if needed (some schemas might have both id and project_id)
    // Try inserting first without project_id, then with it if it fails

    // Try to insert - if project_id error occurs, retry with project_id set
    let { data: project, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .maybeSingle();

    // If error is about project_id, try adding it
    if (error && error.message.includes('project_id') && error.message.includes('null')) {
      // Generate UUID for project_id and try again
      const projectId = randomUUID();
      insertData.project_id = projectId;
      
      const retryResult = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .maybeSingle();
      
      if (retryResult.error) {
        return formatResponse(false, retryResult.error.message, null);
      }
      
      project = retryResult.data;
    } else if (error) {
      return formatResponse(false, error.message, null);
    }

    if (!project) {
      return formatResponse(false, 'Project creation failed - no data returned', null);
    }

    return formatResponse(true, 'Project created successfully', project);
  },

  /**
   * Get project by ID
   */
  async getProjectById(projectId, userId, roleCode, roleName) {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      return formatResponse(false, 'Project not found', null);
    }

    // Check access: owner, contractor, or has canViewAllBids
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    return formatResponse(true, 'Project retrieved', project);
  },

  /**
   * Get all projects for user
   */
  async getUserProjects(userId, roleCode, roleName) {
    let query = supabase.from('projects').select('*');

    // If user has canViewAllBids, show all projects
    // Otherwise, show only projects where user is owner or contractor
    if (!hasPermission(roleCode, roleName, 'canViewAllBids')) {
      query = query.or(`owner_id.eq.${userId},contractor_id.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Projects retrieved', data || []);
  },

  /**
   * Update project
   */
  async updateProject(projectId, updates, userId, roleCode, roleName) {
    // Get existing project
    const { data: existing, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError || !existing) {
      return formatResponse(false, 'Project not found', null);
    }

    // Check permission: can edit all projects OR is owner/contractor
    const canEditAll = hasPermission(roleCode, roleName, 'canEditAllProjects');
    if (!canEditAll && existing.owner_id !== userId && existing.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    // Don't add updated_at if column doesn't exist - let database handle it
    const updateData = { ...updates };

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Project updated successfully', data);
  },

  /**
   * Delete project
   */
  async deleteProject(projectId, userId, roleCode) {
    // Only admins can delete projects
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    if (!isAdmin) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Project deleted successfully', null);
  },
};

