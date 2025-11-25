// Progress Update Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const progressUpdateService = {
  /**
   * Create a progress update
   */
  async createProgressUpdate(data, userId) {
    const {
      project_id,
      milestone_id,
      update_type,
      work_completed,
      work_planned,
      issues,
      hours_worked,
      crew_members,
      photos,
      videos,
      gps_location,
      weather_conditions,
    } = data;

    if (!project_id || !work_completed) {
      return formatResponse(false, 'Missing required fields: project_id, work_completed', null);
    }

    // Verify user is contractor on project OR is admin
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('contractor_id, owner_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return formatResponse(false, 'Project not found', null);
    }

    // Allow contractor OR project owner OR admin to create progress updates
    const isContractor = project.contractor_id === userId;
    const isOwner = project.owner_id === userId;
    
    if (!isContractor && !isOwner) {
      return formatResponse(false, 'Permission denied: Only project contractor or owner can create updates', null);
    }

    const { data: update, error } = await supabase
      .from('progress_updates')
      .insert({
        project_id,
        milestone_id,
        contractor_id: userId,
        update_type: update_type || 'daily',
        work_completed,
        work_planned,
        issues,
        hours_worked,
        crew_members,
        photos: photos || [],
        videos: videos || [],
        gps_location,
        weather_conditions,
        ai_analyzed: false,
      })
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Update project last_update_at
    await supabase
      .from('projects')
      .update({ last_update_at: new Date().toISOString() })
      .eq('id', project_id);

    return formatResponse(true, 'Progress update created successfully', update);
  },

  /**
   * Get progress updates for a project
   */
  async getProjectProgressUpdates(projectId, userId, roleCode, roleName) {
    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return formatResponse(false, 'Project not found', null);
    }

    // Check if user has canViewAllBids or is project participant
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('progress_updates')
      .select('*, profiles(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Progress updates retrieved', data || []);
  },

  /**
   * Get progress update by ID
   */
  async getProgressUpdateById(updateId, userId, roleCode, roleName) {
    const { data: update, error } = await supabase
      .from('progress_updates')
      .select('*, projects(*)')
      .eq('id', updateId)
      .single();

    if (error) {
      return formatResponse(false, 'Progress update not found', null);
    }

    // Check access
    const project = update.projects;
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    return formatResponse(true, 'Progress update retrieved', update);
  },
};

