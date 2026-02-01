import MenuItem from '../models/MenuItem.js';

const VALID_CATEGORIES = ['appetizer', 'main', 'dessert', 'drink', 'side'];

export const menuService = {
  async getAllItems(filters = {}) {
    const {
      sort = JSON.stringify({ name: 1 }),
      min = 0,
      max = 10000000000000,
      category = '',
      name: searchName = '',
      available
    } = filters;

    let sortObj = { name: 1 }; // Default sort
    try {
      sortObj = JSON.parse(sort);
    } catch (error) {
      console.error('Invalid sort parameter, using default');
    }

    const query = {};

    if (searchName) {
      query.name = { $regex: searchName.trim(), $options: 'i' };
    }

    if (category) {
      const categories = category.split(',').map(c => c.trim().toLowerCase());
      const validCategories = categories.filter(c => VALID_CATEGORIES.includes(c));
      
      if (validCategories.length > 0) {
        if (validCategories.length === 1) {
          query.category = validCategories[0];
        } else {
          query.category = { $in: validCategories };
        }
      }
    }

    if (min !== undefined || max !== undefined) {
      query.price = {};
      if (min !== undefined && min !== '') {
        query.price.$gte = Number(min);
      }
      if (max !== undefined && max !== '') {
        query.price.$lte = Number(max);
      }
    }

    if (available !== undefined) {
      query.available = available === 'true' || available === true;
    }

    return await MenuItem.find(query).sort(sortObj);
  },

  async getItemById(id) {
    const item = await MenuItem.findById(id);
    if (!item) {
      throw new Error('Menu item not found');
    }
    return item;
  },

  async createItem(itemData) {
    // Validate required fields
    if (!itemData.name || itemData.price === undefined || !itemData.category) {
      throw new Error('Name, price, and category are required');
    }
    
    if (itemData.price < 0) {
      throw new Error('Price cannot be negative');
    }
    
    const category = itemData.category.toLowerCase();
    if (!VALID_CATEGORIES.includes(category)) {
      throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    
    // Prepare data
    const newItemData = {
      name: itemData.name.trim(),
      description: itemData.description ? itemData.description.trim() : '',
      price: Number(itemData.price),
      category: category,
      available: itemData.available !== false,
      image: itemData.image || ''
    };
    
    const menuItem = new MenuItem(newItemData);
    return await menuItem.save();
  },

  async updateItem(id, updateData) {
    if (updateData.price !== undefined && updateData.price < 0) {
      throw new Error('Price cannot be negative');
    }
    
    if (updateData.category) {
      const category = updateData.category.toLowerCase();
      if (!VALID_CATEGORIES.includes(category)) {
        throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
      }
      updateData.category = category;
    }
    
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!updatedItem) {
      throw new Error('Menu item not found');
    }
    
    return updatedItem;
  },

  async deleteItem(id) {
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      throw new Error('Menu item not found');
    }
    
    return deletedItem;
  },

async getCategories() {
    const categories = await MenuItem.distinct('category');
    return categories.sort((a, b) => 
      VALID_CATEGORIES.indexOf(a) - VALID_CATEGORIES.indexOf(b)
    );
  }
};




