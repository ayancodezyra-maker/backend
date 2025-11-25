// Message Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  getUnreadCount,
} from './messageController.js';

const router = express.Router();

router.post('/', auth, sendMessage);
router.get('/conversations/:conversationId', auth, getConversationMessages);
router.put('/conversations/:conversationId/read', auth, markMessagesAsRead);
router.get('/unread/count', auth, getUnreadCount);

export default router;

