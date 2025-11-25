// Notification Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from './notificationController.js';

const router = express.Router();

router.post('/', auth, createNotification);
router.get('/', auth, getUserNotifications);
router.put('/:id', auth, markAsRead); // PUT /notifications/:id - mark as read
router.put('/:id/read', auth, markAsRead); // PUT /notifications/:id/read - mark as read (alternative)
router.put('/read/all', auth, markAllAsRead);
router.get('/unread/count', auth, getUnreadCount);
router.delete('/:id', auth, deleteNotification);

export default router;

