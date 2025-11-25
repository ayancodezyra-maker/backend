// Message Controller
import { messageService } from './messageService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await messageService.sendMessage(req.body, userId);
    return res.status(result.success ? 201 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const roleCode = req.user?.role_code || req.user?.role;
    const roleName = req.user?.role_name || req.user?.role;
    const result = await messageService.getConversationMessages(conversationId, userId, roleCode, roleName);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const result = await messageService.markMessagesAsRead(conversationId, userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await messageService.getUnreadCount(userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

