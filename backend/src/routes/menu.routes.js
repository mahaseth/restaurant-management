// backend/src/routes/menu.routes.js
import express from 'express';
import {
    getAllMenuItems,
    createMenuItem,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/menu.controller.js';

const router = express.Router();

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItem);
router.put('/:id', updateMenuItem);
router.post('/', createMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;