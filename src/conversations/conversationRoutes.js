// Conversation Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
} from './conversationController.js';

const router = express.Router();

router.post('/', auth, getOrCreateConversation);
router.get('/', auth, getUserConversations);
router.get('/:id', auth, getConversationById);

export default router;

