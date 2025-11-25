// Message Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import { conversationService } from './conversationService.js';
import { hasPermission } from '../permissions/rolePermissions.js';

export const messageService = {
  /**
   * Send a message
   */
  async sendMessage(data, userId) {
    const { conversation_id, receiver_id, content, attachments } = data;

    if (!conversation_id || !content) {
      return formatResponse(false, 'Missing required fields: conversation_id, content', null);
    }

    // Verify user is part of conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return formatResponse(false, 'Conversation not found', null);
    }

    // Check if user is a participant (owner_id, contractor_id, or created_by)
    const isParticipant = conversation.owner_id === userId || 
                         conversation.contractor_id === userId || 
                         conversation.created_by === userId;
    
    // Also check conversation_participants table
    if (!isParticipant) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id)
        .eq('user_id', userId)
        .limit(1);
      
      if (!participants || participants.length === 0) {
        return formatResponse(false, 'Permission denied', null);
      }
    }

    // Auto-determine receiver_id from conversation if not provided
    let finalReceiverId = receiver_id;
    if (!finalReceiverId) {
      // Get the other participant from the conversation
      if (conversation.owner_id === userId) {
        finalReceiverId = conversation.contractor_id;
      } else if (conversation.contractor_id === userId) {
        finalReceiverId = conversation.owner_id;
      } else {
        // Try to get from conversation_participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation_id)
          .neq('user_id', userId)
          .limit(1);
        
        if (participants && participants.length > 0) {
          finalReceiverId = participants[0].user_id;
        }
      }
    }

    // Build insert data
    // Note: Actual database uses 'message' column, not 'content'
    const insertData = {
      conversation_id,
      sender_id: userId,
      message: content, // Use 'message' column (actual schema)
      read: false,
      is_read: false,
      // receiver_id is optional (nullable in schema)
      ...(finalReceiverId ? { receiver_id: finalReceiverId } : {}),
      // attachments field doesn't exist in messages table - ignore for now
    };

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Update conversation last message timestamp
    await conversationService.updateLastMessageAt(conversation_id);

    return formatResponse(true, 'Message sent successfully', message);
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId, userId, roleCode, roleName) {
    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return formatResponse(false, 'Conversation not found', null);
    }

    // Admins can view all conversations
    const isAdmin = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(roleCode?.toUpperCase());
    const canViewAll = hasPermission(roleCode, roleName, 'canViewAllBids');

    // Check if user is a participant (owner_id, contractor_id, or created_by)
    const isParticipant = conversation.owner_id === userId || 
                         conversation.contractor_id === userId || 
                         conversation.created_by === userId;
    
    // Also check conversation_participants table
    if (!isParticipant && !isAdmin && !canViewAll) {
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .limit(1);
      
      if (partError || !participants || participants.length === 0) {
        return formatResponse(false, 'Permission denied: You are not a participant in this conversation', null);
      }
    }

    // Get messages - use simpler select without foreign key join (might not work)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Messages retrieved', data || []);
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return formatResponse(false, 'Conversation not found', null);
    }

    // Check if user is a participant
    const isParticipant = conversation.owner_id === userId || 
                         conversation.contractor_id === userId || 
                         conversation.created_by === userId;
    
    if (!isParticipant) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .limit(1);
      
      if (!participants || participants.length === 0) {
        return formatResponse(false, 'Permission denied', null);
      }
    }

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Messages marked as read', null);
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Unread count retrieved', { count: count || 0 });
  },
};

