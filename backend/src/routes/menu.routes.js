import express from 'express';
import {
    getAllMenuItems,
    getPublicMenuItems,
    createMenuItem,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    replaceMenuItemImage,
    deleteMenuItemImage
} from '../controllers/menu.controller.js';
import auth from '../middlewares/auth.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from '../constants/roles.js';
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Public endpoint used by QR ordering page (no auth)
router.get('/public', getPublicMenuItems);

// All routes require authentication
// GET routes - any authenticated user can view
router.get('/', auth, getAllMenuItems);
router.get('/:id', auth, getMenuItem);

// Mutation routes - only OWNER, ADMIN and MANAGER can modify
router.post('/', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), createMenuItem);
router.put('/:id', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), updateMenuItem);
router.delete('/:id', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), deleteMenuItem);

// Image endpoints (upload/delete) - same roles as mutations
router.post(
  "/:id/image",
  auth,
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]),
  upload.single("image"),
  replaceMenuItemImage
);
router.delete(
  "/:id/image",
  auth,
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]),
  deleteMenuItemImage
);

export default router;