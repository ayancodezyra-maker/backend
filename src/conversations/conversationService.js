// Conversation Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const conversationService = {
  /**
   * Create or get existing conversation
   */
  async getOrCreateConversation(data, userId) {
    const { project_id, job_id, bid_id, owner_id, contractor_id, subject } = data;

    // Determine owner_id and contractor_id from context
    let finalOwnerId = owner_id;
    let finalContractorId = contractor_id;

    // If not provided, try to get from project/job/bid
    if (!finalOwnerId || !finalContractorId) {
      if (project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id, contractor_id')
          .eq('id', project_id)
          .single();
        
        if (project) {
          finalOwnerId = finalOwnerId || project.owner_id;
          finalContractorId = finalContractorId || project.contractor_id;
        }
      }
    }

    // If still missing, use userId as fallback
    if (!finalOwnerId && !finalContractorId) {
      return formatResponse(false, 'Missing required fields: owner_id and contractor_id, or project_id to determine participants', null);
    }

    // Ensure we have both participants
    if (!finalOwnerId) finalOwnerId = userId;
    if (!finalContractorId) finalContractorId = userId;

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('*');

    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (job_id) {
      query = query.eq('job_id', job_id);
    }
    if (bid_id) {
      query = query.eq('bid_id', bid_id);
    }

    // Check for existing conversation with same participants
    query = query.or(`owner_id.eq.${finalOwnerId},contractor_id.eq.${finalContractorId}`)
      .or(`owner_id.eq.${finalContractorId},contractor_id.eq.${finalOwnerId}`);

    const { data: existing } = await query.single();

    if (existing) {
      return formatResponse(true, 'Conversation retrieved', existing);
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        created_by: userId,
        owner_id: finalOwnerId,
        contractor_id: finalContractorId,
        project_id: project_id || null,
        job_id: job_id || null,
        bid_id: bid_id || null,
        subject: subject || null,
      })
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Add participants to conversation_participants table
    const participants = [finalOwnerId, finalContractorId].filter((id, index, self) => 
      id && self.indexOf(id) === index // Remove duplicates
    );

    await supabase.from('conversation_participants').insert(
      participants.map(user_id => ({
        conversation_id: conversation.id,
        user_id: user_id,
      }))
    );

    return formatResponse(true, 'Conversation created', conversation);
  },

  /**
   * Get user's conversations
   */
  async getUserConversations(userId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, conversation_participants(*, profiles(*))')
      .or(`owner_id.eq.${userId},contractor_id.eq.${userId},created_by.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Conversations retrieved', data || []);
  },

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId, userId) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*, conversation_participants(*, profiles(*))')
      .eq('id', conversationId)
      .single();

    if (error) {
      return formatResponse(false, 'Conversation not found', null);
    }

    // Check if user is a participant
    if (conversation.owner_id !== userId && conversation.contractor_id !== userId && conversation.created_by !== userId) {
      // Also check conversation_participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (!participants || participants.length === 0) {
        return formatResponse(false, 'Permission denied', null);
      }
    }

    return formatResponse(true, 'Conversation retrieved', conversation);
  },

  /**
   * Update conversation last message timestamp
   */
  async updateLastMessageAt(conversationId) {
    const { error } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Conversation updated', null);
  },
};

