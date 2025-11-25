// Notification Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const notificationService = {
  /**
   * Create a notification
   */
  async createNotification(data) {
    const { user_id, type, title, message, body, priority, action_url, job_id, application_id, bid_id, project_id, milestone_id, dispute_id, metadata } = data;

    // Support both message and body fields
    const notificationMessage = message || body;

    // Based on actual database schema: id, user_id, title, body, is_read, read, message, metadata, 
    // job_id, application_id, bid_id, project_id, milestone_id, dispute_id, action_url, bid, created_at
    // Note: type and priority columns do NOT exist in actual database
    if (!user_id || !title || !notificationMessage) {
      return formatResponse(false, 'Missing required fields: user_id, title, message (or body)', null);
    }

    // Build notification data - use actual columns that exist
    const notificationData = {
      user_id,
      title,
      message: notificationMessage, // Use message column
      body: notificationMessage, // Also set body (both exist)
      is_read: false, // Use is_read column
      read: false, // Also set read (both exist)
    };

    // Add optional fields that exist in actual database
    if (metadata) notificationData.metadata = metadata;
    if (job_id) notificationData.job_id = job_id;
    if (application_id) notificationData.application_id = application_id;
    if (bid_id) notificationData.bid_id = bid_id;
    if (project_id) notificationData.project_id = project_id;
    if (milestone_id) notificationData.milestone_id = milestone_id;
    if (dispute_id) notificationData.dispute_id = dispute_id;
    if (action_url) notificationData.action_url = action_url;
    
    // Note: type and priority columns do NOT exist - cannot store them

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Notification created', notification);
  },

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, filters = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (filters.read !== undefined) {
      query = query.eq('is_read', filters.read);
    }

    // Note: type and priority columns don't exist in actual database - skip filters
    // if (filters.type) {
    //   query = query.eq('type', filters.type);
    // }
    // if (filters.priority) {
    //   query = query.eq('priority', filters.priority);
    // }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Notifications retrieved', data || []);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    // Verify notification belongs to user
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .maybeSingle();

    if (!notification || notification.user_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, // Update is_read
        read: true, // Also update read (both columns exist)
      })
      .eq('id', notificationId)
      .select()
      .maybeSingle();

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Notification marked as read', data);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, // Update is_read
        read: true, // Also update read (both columns exist)
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'All notifications marked as read', null);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Unread count retrieved', { count: count || 0 });
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    // Verify notification belongs to user
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .maybeSingle();

    if (!notification || notification.user_id !== userId) {
      return formatResponse(false, 'Permission denied', null);
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Notification deleted', null);
  },
};

