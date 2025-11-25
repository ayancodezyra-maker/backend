// Payment Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const paymentService = {
  /**
   * Create a payment
   */
  async createPayment(data, userId, roleCode, roleName) {
    // Check permission
    if (!hasPermission(roleCode, roleName, 'canManagePayments')) {
      return formatResponse(false, 'Permission denied: canManagePayments', null);
    }

    const { project_id, milestone_id, payment_type, amount, payment_method, due_date, payment_date } = data;

    if (!project_id || !amount) {
      return formatResponse(false, 'Missing required fields: project_id, amount', null);
    }

    // Auto-determine payment_type if not provided
    let finalPaymentType = payment_type;
    if (!finalPaymentType) {
      if (milestone_id) {
        finalPaymentType = 'milestone';
      } else {
        finalPaymentType = 'deposit'; // Default to deposit if no milestone
      }
    }

    // Get project to determine payment recipient
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return formatResponse(false, 'Project not found', null);
    }

    // Auto-determine paid_to based on payment_type
    let paid_to = null;

    if (finalPaymentType === 'milestone' || finalPaymentType === 'deposit' || finalPaymentType === 'final') {
      // For milestone, deposit, and final payments → paid_to = contractor_id
      paid_to = project.contractor_id;
    } else if (finalPaymentType === 'refund') {
      // For refunds → paid_to = owner_id
      paid_to = project.owner_id;
    } else {
      // Default: try to use contractor_id
      paid_to = project.contractor_id;
    }

    if (!paid_to) {
      return formatResponse(false, 'Could not determine payment recipient: project missing contractor_id', null);
    }

    // If milestone_id is provided, verify it belongs to the project
    if (milestone_id) {
      const { data: milestone } = await supabase
        .from('project_milestones')
        .select('project_id')
        .eq('id', milestone_id)
        .eq('project_id', project_id)
        .single();

      if (!milestone) {
        return formatResponse(false, 'Milestone not found or does not belong to this project', null);
      }
    }

    // Build insert data - match actual schema (no released_by/released_to)
    // Status must be one of: 'escrow', 'released', 'refunded' (per check constraint)
    const insertData = {
      milestone_id: milestone_id || null,
      amount: amount,
      project_id: project_id, // Always required now
      payment_type: finalPaymentType, // Auto-determined if not provided
      paid_to: paid_to, // Always required now, auto-determined
      payment_method: payment_method || null,
      notes: data.notes || null,
      payment_date: payment_date || null,
      // Status: Explicitly set to 'escrow' (lowercase) to match constraint
      // Constraint allows: 'escrow', 'released', 'refunded'
      status: (data.status && ['escrow', 'released', 'refunded'].includes(String(data.status).toLowerCase()))
        ? String(data.status).toLowerCase()
        : 'escrow', // Default to 'escrow' if not provided or invalid
      // Note: paid_by column exists in some schemas but we'll let it be NULL
      // The database will handle created_at automatically
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payment created successfully', payment);
  },

  /**
   * Get all payments
   */
  async getAllPayments(userId, roleCode, roleName) {
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');

    let query = supabase.from('payments').select('*, projects(*)');

    // If user doesn't have canManagePayments, filter by project ownership
    if (!canManage) {
      query = query.or(`projects.owner_id.eq.${userId},projects.contractor_id.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payments retrieved', data || []);
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId, userId, roleCode, roleName) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, projects(*)')
      .eq('id', paymentId)
      .single();

    if (error) {
      return formatResponse(false, 'Payment not found', null);
    }

    // Check if user can view this payment
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');
    if (!canManage && payment.projects) {
      const project = payment.projects;
      if (project.owner_id !== userId && project.contractor_id !== userId) {
        return formatResponse(false, 'Permission denied', null);
      }
    }

    return formatResponse(true, 'Payment retrieved', payment);
  },

  /**
   * Update payment
   */
  async updatePayment(paymentId, updates, userId, roleCode, roleName) {
    // Check permission
    if (!hasPermission(roleCode, roleName, 'canManagePayments')) {
      return formatResponse(false, 'Permission denied: canManagePayments', null);
    }

    const { data, error } = await supabase
      .from('payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payment updated successfully', data);
  },

  /**
   * Get payments for a project
   */
  async getProjectPayments(projectId, userId, roleCode, roleName) {
    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, contractor_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return formatResponse(false, 'Project not found', null);
    }

    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');
    if (!canManage && project.owner_id !== userId && project.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payments retrieved', data || []);
  },
};

