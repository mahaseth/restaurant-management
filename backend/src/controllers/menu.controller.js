import { menuService } from '../services/menu.service.js';

export const getAllMenuItems = async (req, res) => {
  try {
    const filters = {
      sort: req.query.sort,
      min: req.query.min,
      max: req.query.max,
      category: req.query.category,
      name: req.query.name,
      available: req.query.available
    };
    const menuItems = await menuService.getAllItems(filters);
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const menuItem = await menuService.getItemById(req.params.id);
    res.json(menuItem);
  } catch (error) {
    if (error.message === 'Menu item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const menuItem = await menuService.createItem(req.body);
    res.status(201).json(menuItem);
  } catch (error) {
    if (error.message.includes('required') || 
        error.message.includes('cannot be negative')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await menuService.updateItem(req.params.id, req.body);
    res.json(menuItem);
  } catch (error) {
    if (error.message === 'Menu item not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('cannot be negative')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await menuService.deleteItem(req.params.id);
    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully',
      deletedItem 
    });
  } catch (error) {
    if (error.message === 'Menu item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};
export const getCategories = async (req, res) => {
  try {
    const categories = await menuService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

