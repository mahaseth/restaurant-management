import MenuItem from '../models/MenuItem.js';


export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
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
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );  
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
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
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
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

