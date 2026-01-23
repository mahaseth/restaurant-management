import express from 'express';
import {
    getAllMenuItems,
    createMenuItem,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories
} from '../controllers/menu.controller.js';

const router = express.Router();

router.get('/', getAllMenuItems);
router.get('/categories', getCategories);
router.get('/:id', getMenuItem);
router.put('/:id', updateMenuItem);
router.post('/', createMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;