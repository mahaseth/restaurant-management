import Table from '../models/Table.js';
import Order from "../models/Order.js";
import { generateTableQRCode } from '../utils/qrCode.js';

/**
 * @desc Create a new table
 * @route POST /api/tables
 */
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;
    const restaurantId = req.restaurant._id;

    // Check if table number already exists for this restaurant
    const existingTable = await Table.findOne({ restaurantId, tableNumber });
    if (existingTable) {
      return res.status(400).json({ error: `Table number ${tableNumber} already exists for this restaurant.` });
    }

    const table = new Table({
      tableNumber,
      restaurantId,
      capacity,
      status
    });

    // Generate QR code using the new table's ID
    // Use request Origin so QR matches how the admin UI was accessed
    // (localhost vs LAN IP).
    const { qrDataUrl, orderLink } = await generateTableQRCode(table._id, restaurantId, { appUrl: req.get("origin") });
    table.qrCode = qrDataUrl;
    table.qrLink = orderLink;

    await table.save();
    res.status(201).json(table);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error creating table' });
  }
};

/**
 * @desc Regenerate QR code for a table (useful when switching from localhost to LAN/Wi-Fi)
 * @route POST /api/tables/:id/regenerate-qr
 */
export const regenerateTableQr = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const table = await Table.findOne({ _id: req.params.id, restaurantId });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    const { qrDataUrl, orderLink } = await generateTableQRCode(table._id, restaurantId, { appUrl: req.get("origin") });
    table.qrCode = qrDataUrl;
    table.qrLink = orderLink;
    await table.save();

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: "Server error regenerating QR code" });
  }
};

/**
 * @desc Get all tables for restaurant
 * @route GET /api/tables
 */
export const getAllTables = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 }).lean();

    // Attach current (not closed) order status for each table so UI can show "occupied".
    // We treat CANCELLED and CLOSED as not occupying a table.
    const activeOrders = await Order.find({
      restaurantId,
      status: { $nin: ["CANCELLED", "CLOSED"] },
    })
      .sort({ createdAt: -1 })
      .select("_id tableId orderNumber status paymentStatus total createdAt updatedAt")
      .lean();

    const currentOrderByTableId = new Map();
    for (const o of activeOrders) {
      const tId = String(o.tableId);
      if (!currentOrderByTableId.has(tId)) currentOrderByTableId.set(tId, o);
    }

    const withOccupancy = tables.map((t) => ({
      ...t,
      currentOrder: currentOrderByTableId.get(String(t._id)) || null,
    }));

    res.json(withOccupancy);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching tables' });
  }
};

/**
 * @desc Get single table by ID
 * @route GET /api/tables/:id
 */
export const getTable = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const table = await Table.findOne({ _id: req.params.id, restaurantId });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching table' });
  }
};

/**
 * @desc Update table
 * @route PUT /api/tables/:id
 */
export const updateTable = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    
    // Check if updating to a table number that already exists (if tableNumber is provided)
    if (req.body.tableNumber) {
      const existingTable = await Table.findOne({ 
        restaurantId, 
        tableNumber: req.body.tableNumber,
        _id: { $ne: req.params.id }
      });
      if (existingTable) {
        return res.status(400).json({ error: `Table number ${req.body.tableNumber} already belongs to another table.` });
      }
    }

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error updating table' });
  }
};

/**
 * @desc Delete table
 * @route DELETE /api/tables/:id
 */
export const deleteTable = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const table = await Table.findOneAndDelete({ _id: req.params.id, restaurantId });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting table' });
  }
};
