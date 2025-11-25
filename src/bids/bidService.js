// Bid Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const bidService = {
  /**
   * Create a new bid
   */
  async createBid(data, userId, roleCode, roleName) {
    // Check permission
    if (!hasPermission(roleCode, roleName, 'canCreateBids')) {
      return formatResponse(false, 'Permission denied: canCreateBids', null);
    }

    const { project_id, amount, notes } = data;

    if (!project_id || !amount) {
      return formatResponse(false, 'Missing required fields: project_id, amount', null);
    }

    const { data: bid, error } = await supabase
      .from('bids')
      .insert({
        project_id,
        amount,
        notes: notes || null,
        submitted_by: userId, // Always set from authenticated user
        status: 'pending', // Use 'pending' as default per schema
      })
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Bid created successfully', bid);
  },

  /**
   * Get all bids
   */
  async getAllBids(userId, roleCode, roleName) {
    let query = supabase.from('bids').select('*');

    // If user doesn't have canViewAllBids, show only their bids
    if (!hasPermission(roleCode, roleName, 'canViewAllBids')) {
      query = query.eq('submitted_by', userId); // Use submitted_by (actual column name)
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Bids retrieved', data || []);
  },

  /**
   * Get bid by ID
   */
  async getBidById(bidId, userId, roleCode, roleName) {
    const { data: bid, error } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    if (error) {
      return formatResponse(false, 'Bid not found', null);
    }

    // Check if user can view this bid
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && bid.submitted_by !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    return formatResponse(true, 'Bid retrieved', bid);
  },

  /**
   * Update bid
   */
  async updateBid(bidId, updates, userId, roleCode, roleName) {
    // Get existing bid
    const { data: existing, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    if (fetchError || !existing) {
      return formatResponse(false, 'Bid not found', null);
    }

    // Check permission: can edit all projects OR is bid creator
    const canEditAll = hasPermission(roleCode, roleName, 'canEditAllProjects');
    if (!canEditAll && existing.submitted_by !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('bids')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bidId)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Bid updated successfully', data);
  },
};

