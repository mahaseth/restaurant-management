const MenuItem = require('../models/MenuItem');

exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        
        // Check required fields
        if (!name || !description || !price || !category) {
            return res.status(400).json({ 
                error: 'Name, description, price, and category are required' 
            });
        }
        
        // Check price
        if (price < 0) {
            return res.status(400).json({ 
                error: 'Price cannot be negative' 
            });
        }
        
        // Check valid category
        const validCategories = ['appetizer', 'main', 'dessert', 'drink', 'side'];
        if (!validCategories.includes(category.toLowerCase())) {
            return res.status(400).json({ 
                error: 'Category must be: appetizer, main, dessert, drink, or side' 
            });
        }
        
        // Create menu item
        const menuItem = await MenuItem.create({
            name: name.trim(),
            description: description.trim(),
            price: price,
            category: category.toLowerCase(),
            available: req.body.available !== false,
            image: req.body.image || ''
        });
        
        res.status(201).json(menuItem);
        
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: error.message 
            });
        }
        
        res.status(500).json({ 
            error: 'Server error creating menu item' 
        });
    }
};



