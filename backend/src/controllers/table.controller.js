import Table from '../models/Table.js';

/**
 * @desc Create a new table
 * @route POST /api/tables
 */
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status, qrCode } = req.body;
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
      status,
      qrCode
    });

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
 * @desc Get all tables for restaurant
 * @route GET /api/tables
 */
export const getAllTables = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
    res.json(tables);
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
