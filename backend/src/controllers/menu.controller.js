import MenuItem from '../models/MenuItem.js';


export const getAllMenuItems = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const menuItems = await MenuItem.find({ restaurantId });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getMenuItem = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      restaurantId 
    });
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    } 
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updateMenuItem = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;
        
        // First check if the menu item exists and belongs to this restaurant
        const existingItem = await MenuItem.findOne({ 
            _id: req.params.id, 
            restaurantId 
        });
        
        if (!existingItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        // Update the menu item
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user._id },
            { new: true, runValidators: true }
        );  
        
        res.json(menuItem);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error updating menu item' });
    }
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const restaurantId = req.restaurant._id;
    
    if (!name || price === undefined || !category) {
      return res.status(400).json({ 
        error: 'Name, price, and category are required' 
      });
    }
    
    if (price < 0) {
      return res.status(400).json({ 
        error: 'Price cannot be negative' 
      });
    }
    
    const menuItem = new MenuItem({
      restaurantId,
      createdBy: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      price,
      category: category.toLowerCase(),
      available: req.body.available !== false,
      image: req.body.image || ''
    });
    
    await menuItem.save();
    res.status(201).json(menuItem);
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error creating menu item' });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    
    // Find and delete only if it belongs to this restaurant
    const menuItem = await MenuItem.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId 
    });
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully',
      deletedItem: menuItem 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

