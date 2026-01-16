import express from 'express';
import {
  createTable,
  getAllTables,
  getTable,
  updateTable,
  deleteTable
} from '../controllers/table.controller.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';
import { ROLE_OWNER, ROLE_ADMIN } from '../constants/roles.js';

const router = express.Router();

// All routes are behind auth middleware in app.js
// Read ops - anyone with restaurant access
router.get('/', getAllTables);
router.get('/:id', getTable);

// Mutation ops - Owner and Admin only
router.post('/', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN]), createTable);
router.put('/:id', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN]), updateTable);
router.delete('/:id', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN]), deleteTable);

export default router;
