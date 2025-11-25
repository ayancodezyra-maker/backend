// Progress Update Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createProgressUpdate,
  getProjectProgressUpdates,
  getProgressUpdateById,
} from './progressUpdateController.js';

const router = express.Router();

router.post('/', auth, createProgressUpdate);
router.get('/projects/:projectId', auth, getProjectProgressUpdates);
router.get('/:id', auth, getProgressUpdateById);

export default router;

