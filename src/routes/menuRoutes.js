const express = require('express');
const router = express.Router();
const {   
    createMenuItem,
    deleteMenuItem,
} = require('../controllers/menuController');


// Admin routes (add authentication later)
router.post('/', createMenuItem);
router.delete('/:id', deleteMenuItem);


module.exports = router;