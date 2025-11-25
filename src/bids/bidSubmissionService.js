// Bid Submission Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const bidSubmissionService = {
  /**
   * Submit a bid
   */
  async submitBid(bidId, data, userId, roleCode, roleName) {
    // Contractors (CONTRACTOR, SUB, GC) can submit bids
    // Admins can also submit bids (for testing/admin purposes)
    const contractorRoles = ['CONTRACTOR', 'SUB', 'GC']; // GC can also submit bids
    const adminRoles = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD']; // Admins can submit bids
    const isContractor = contractorRoles.includes(roleCode?.toUpperCase());
    const isAdmin = adminRoles.includes(roleCode?.toUpperCase());
    
    if (!isContractor && !isAdmin) {
      return formatResponse(false, 'Only contractors or admins can submit bids', null);
    }

    // Validate required fields
    const { amount, proposal, timeline_days, documents, notes, contractor_id } = data;

    // Amount is required for contractors, optional for admins (can use bid amount)
    if (!isAdmin && !amount) {
      return formatResponse(false, 'Amount is required', null);
    }

    // Admins can submit on behalf of contractors by providing contractor_id
    // Contractors can only submit for themselves
    let finalContractorId = userId;
    if (contractor_id) {
      if (isAdmin) {
        // Admins can submit on behalf of any contractor
        finalContractorId = contractor_id;
      } else if (contractor_id !== userId) {
        // Contractors can only submit for themselves
        return formatResponse(false, "You cannot submit another contractor's bid submission", null);
      }
    }

    // Check if bid exists
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return formatResponse(false, 'Bid not found', null);
    }

    // Check if already submitted (use finalContractorId)
    const { data: existing } = await supabase
      .from('bid_submissions')
      .select('*')
      .eq('bid_id', bidId)
      .eq('contractor_id', finalContractorId)
      .maybeSingle();

    if (existing) {
      return formatResponse(false, 'Bid already submitted', null);
    }

    // Prepare insert data - ensure created_by is always set to userId
    // Use bid amount if amount not provided (for admins)
    const finalAmount = amount || bid.amount || 0;
    
    const insertData = {
      bid_id: bidId,
      contractor_id: finalContractorId, // Use finalContractorId (allows admins to submit for others)
      amount: finalAmount,
      proposal: proposal || null,
      timeline_days: timeline_days || null,
      documents: documents || [],
      notes: notes || null,
      status: 'pending',
      created_by: userId, // Always set created_by to the authenticated user (admin or contractor)
    };

    // Use array format for insert and ensure created_by is never NULL
    const { data: submission, error } = await supabase
      .from('bid_submissions')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Bid submitted successfully', submission);
  },

  /**
   * Get submissions for a bid
   */
  async getBidSubmissions(bidId, userId, roleCode, roleName) {
    // Check if bid exists and get submitted_by
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('submitted_by')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return formatResponse(false, 'Bid not found', null);
    }

    // Check if user can view all bids or is bid creator
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');
    if (!canViewAll && bid.submitted_by !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('bid_submissions')
      .select('*')
      .eq('bid_id', bidId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Submissions retrieved', data || []);
  },

  /**
   * Get user's submissions
   */
  async getUserSubmissions(userId) {
    const { data, error } = await supabase
      .from('bid_submissions')
      .select('*, bids(*)')
      .eq('created_by', userId) // Use created_by for RLS compatibility
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Submissions retrieved', data || []);
  },

  /**
   * Update a bid submission (only by creator)
   */
  async updateBidSubmission(submissionId, data, userId) {
    // Validate user ID
    if (!userId) {
      return formatResponse(false, 'Unauthorized: User ID missing', null);
    }

    // Check if submission exists and user is the creator
    const { data: existing, error: fetchError } = await supabase
      .from('bid_submissions')
      .select('created_by')
      .eq('id', submissionId)
      .single();

    if (fetchError || !existing) {
      return formatResponse(false, 'Bid submission not found', null);
    }

    // Verify user is the creator
    if (existing.created_by !== userId) {
      return formatResponse(false, 'You can only update your own bid submissions', null);
    }

    // Prepare update data - never allow updating created_by
    const { created_by, contractor_id, bid_id, ...updateData } = data;
    
    // Only allow updating certain fields
    const allowedFields = {
      amount: updateData.amount,
      proposal: updateData.proposal,
      timeline_days: updateData.timeline_days,
      documents: updateData.documents,
      notes: updateData.notes,
      status: updateData.status,
    };

    // Remove undefined values
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    const { data: submission, error } = await supabase
      .from('bid_submissions')
      .update(allowedFields)
      .eq('id', submissionId)
      .eq('created_by', userId) // Ensure RLS policy allows update
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Bid submission updated successfully', submission);
  },

  /**
   * Get a single bid submission by ID
   */
  async getBidSubmissionById(submissionId, userId) {
    const { data: submission, error } = await supabase
      .from('bid_submissions')
      .select('*, bids(*)')
      .eq('id', submissionId)
      .eq('created_by', userId) // RLS will enforce this
      .single();

    if (error) {
      return formatResponse(false, error.message || 'Bid submission not found', null);
    }

    if (!submission) {
      return formatResponse(false, 'Bid submission not found', null);
    }

    return formatResponse(true, 'Bid submission retrieved', submission);
  },
};

