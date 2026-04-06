import MenuItem from '../models/MenuItem.js';
import mongoose from "mongoose";
import uploadFile, { deleteCloudinaryFileByUrl } from "../utils/fileUploader.js";
import { syncMenuAndUpdateAgentMeta } from "../features/ai-studio/services/menuSync.service.js";

/** Rebuild AI menu embeddings without blocking the HTTP response. */
function scheduleMenuAiSync(restaurantId) {
  void syncMenuAndUpdateAgentMeta(restaurantId).catch((err) => {
    console.error("[menu] AI menu sync failed:", err?.message || err);
  });
}


export const getAllMenuItems = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const menuItems = await MenuItem.find({ restaurantId });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Public menu endpoint (for QR ordering page)
// GET /api/menuitems/public?restaurantId=...
export const getPublicMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: "Valid restaurantId is required." });
    }

    // Only expose safe fields to customers.
    const items = await MenuItem.find({ restaurantId })
      .select("name description price category available image restaurantId")
      .sort({ category: 1, name: 1 })
      .lean();

    res.status(200).json(items);
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
        
        scheduleMenuAiSync(restaurantId);
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
    scheduleMenuAiSync(restaurantId);
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

    scheduleMenuAiSync(restaurantId);
    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully',
      deletedItem: menuItem 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// =====================
// Image helpers (staff)
// =====================

/**
 * Replace menu item image (upload).
 * POST /api/menuitems/:id/image (multipart/form-data with "image")
 */
export const replaceMenuItemImage = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const existing = await MenuItem.findOne({ _id: id, restaurantId });
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Best-effort: delete previous image (if it was hosted on Cloudinary).
    if (existing.image) {
      try {
        await deleteCloudinaryFileByUrl(existing.image);
      } catch {
        // Ignore deletion errors; we still want DB to reflect new image.
      }
    }

    const uploaded = await uploadFile([req.file], `/rest-id-${restaurantId}/menu-items`);
    existing.image = uploaded?.[0]?.url || "";
    existing.updatedBy = req.user._id;
    await existing.save();

    scheduleMenuAiSync(restaurantId);
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error replacing menu image' });
  }
};

/**
 * Delete menu item image (clears DB + best-effort Cloudinary delete).
 * DELETE /api/menuitems/:id/image
 */
export const deleteMenuItemImage = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { id } = req.params;

    const existing = await MenuItem.findOne({ _id: id, restaurantId });
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (existing.image) {
      try {
        await deleteCloudinaryFileByUrl(existing.image);
      } catch {
        // Ignore deletion failures; clearing DB value still makes UI consistent.
      }
    }

    existing.image = "";
    existing.updatedBy = req.user._id;
    await existing.save();

    scheduleMenuAiSync(restaurantId);
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error deleting menu image' });
  }
};

