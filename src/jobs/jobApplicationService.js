// Job Application Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const jobApplicationService = {
  /**
   * Apply to a job
   */
  async applyToJob(jobId, data, userId) {
    const { cover_letter, proposed_rate, availability_start } = data;

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return formatResponse(false, 'Job not found', null);
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('contractor_id', userId)
      .single();

    if (existing) {
      return formatResponse(false, 'Already applied to this job', null);
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        contractor_id: userId,
        cover_letter,
        proposed_rate,
        availability_start,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Application submitted successfully', application);
  },

  /**
   * Get applications for a job
   */
  async getJobApplications(jobId, userId, roleCode, roleName) {
    // Check if user is job poster or has canManageApplications
    const { data: job } = await supabase
      .from('jobs')
      .select('project_manager_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      return formatResponse(false, 'Job not found', null);
    }

    const canManage = hasPermission(roleCode, roleName, 'canManageApplications');
    if (!canManage && job.project_manager_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('job_applications')
      .select('*, profiles(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Applications retrieved', data || []);
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, status, userId, roleCode, roleName) {
    // Get application with job info
    const { data: application, error: fetchError } = await supabase
      .from('job_applications')
      .select('*, jobs!inner(project_manager_id)')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return formatResponse(false, 'Application not found', null);
    }

    const canManage = hasPermission(roleCode, roleName, 'canManageApplications');
    if (!canManage && application.jobs.project_manager_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Application status updated', data);
  },
};

