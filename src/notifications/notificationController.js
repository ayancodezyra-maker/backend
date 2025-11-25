// Notification Controller
import { notificationService } from './notificationService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const createNotification = async (req, res) => {
  try {
    const result = await notificationService.createNotification(req.body);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUserNotifications(userId, req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await notificationService.markAsRead(id, userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUnreadCount(userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await notificationService.deleteNotification(id, userId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

