import express from 'express';
import {
    getAllMenuItems,
    createMenuItem,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/menu.controller.js';
import auth from '../middlewares/auth.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from '../constants/roles.js';

const router = express.Router();

// All routes require authentication
// GET routes - any authenticated user can view
router.get('/', auth, getAllMenuItems);
router.get('/:id', auth, getMenuItem);

// Mutation routes - only OWNER, ADMIN and MANAGER can modify
router.post('/', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), createMenuItem);
router.put('/:id', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), updateMenuItem);
router.delete('/:id', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), deleteMenuItem);

export default router;