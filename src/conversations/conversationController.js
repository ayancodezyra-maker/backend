// Conversation Controller
import { conversationService } from './conversationService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await conversationService.getOrCreateConversation(req.body, userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await conversationService.getUserConversations(userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await conversationService.getConversationById(id, userId);
    return res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

