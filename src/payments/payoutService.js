// Payout Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const payoutService = {
  /**
   * Create a payout
   */
  async createPayout(data, userId, roleCode, roleName) {
    // Check permission - admins have full access
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');
    
    if (!isAdmin && !canManage) {
      return formatResponse(false, 'Permission denied: canManagePayments or admin role required', null);
    }

    const { payment_id, contractor_id, amount, project_id, stripe_account_id, processor_payout_id } = data;

    if (!contractor_id || !amount) {
      return formatResponse(false, 'Missing required fields: contractor_id, amount', null);
    }

    // Build insert data - only use columns that exist in actual schema
    // Actual schema has: payment_id, contractor_id, project_id, amount, status, 
    // stripe_account_id, processor_payout_id, failure_reason, created_at, updated_at
    const insertData = {
      payment_id: payment_id || null,
      contractor_id,
      project_id: project_id || null,
      amount,
      status: 'pending', // Default status
      stripe_account_id: stripe_account_id || null,
      processor_payout_id: processor_payout_id || null,
      // Note: payout_method, payout_date, account_details don't exist in actual schema
      // The database will handle created_at and updated_at automatically
    };

    const { data: payout, error } = await supabase
      .from('payouts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payout created successfully', payout);
  },

  /**
   * Get all payouts
   */
  async getAllPayouts(userId, roleCode, roleName) {
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');

    let query = supabase.from('payouts').select('*, payments(*), profiles(*)');

    // If user doesn't have canManagePayments, show only their payouts
    if (!canManage) {
      query = query.eq('contractor_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payouts retrieved', data || []);
  },

  /**
   * Get payout by ID
   */
  async getPayoutById(payoutId, userId, roleCode, roleName) {
    const { data: payout, error } = await supabase
      .from('payouts')
      .select('*, payments(*), profiles(*)')
      .eq('id', payoutId)
      .single();

    if (error) {
      return formatResponse(false, 'Payout not found', null);
    }

    // Check if user can view this payout
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');
    if (!canManage && payout.contractor_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    return formatResponse(true, 'Payout retrieved', payout);
  },

  /**
   * Update payout status
   */
  async updatePayoutStatus(payoutId, status, userId, roleCode, roleName) {
    // Check permission - admins have full access
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    const canManage = hasPermission(roleCode, roleName, 'canManagePayments');
    
    if (!isAdmin && !canManage) {
      return formatResponse(false, 'Permission denied: canManagePayments or admin role required', null);
    }

    const updates = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') {
      updates.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payouts')
      .update(updates)
      .eq('id', payoutId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Payout status updated', data);
  },
};

