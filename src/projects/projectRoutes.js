// Project Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { guard } from '../permissions/rolePermissions.js';
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
} from './projectController.js';

const router = express.Router();

router.post('/', auth, guard('canCreateBids'), createProject);
router.get('/', auth, getUserProjects);
router.get('/:id', auth, getProjectById);
router.put('/:id', auth, guard('canEditAllProjects'), updateProject);
router.delete('/:id', auth, deleteProject);

export default router;

