import express from 'express';
import {
    getAllMenuItems,
    createMenuItem,
    deleteMenuItem
} from '../controllers/menu.controller.js';

const router = express.Router();

router.get('/', getAllMenuItems);
router.post('/', createMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;