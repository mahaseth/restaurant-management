import express from 'express';
import {
  createTable,
  getAllTables,
  getTable,
  updateTable,
  deleteTable
} from '../controllers/table.controller.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from '../constants/roles.js';

const router = express.Router();

// All routes are behind auth middleware in app.js
// Read ops - anyone with restaurant access
router.get('/', getAllTables);
router.get('/:id', getTable);

// Mutation ops - Owner, Admin and Manager only
router.post('/', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), createTable);
router.put('/:id', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), updateTable);
router.delete('/:id', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]), deleteTable);

export default router;
