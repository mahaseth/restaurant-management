import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import mongoose from 'mongoose';

/**
 * Helper: Validate items and calculate totals
 */
const validateAndCalculateOrder = async (items) => {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const { productId, quantity, modifiers } = item;

    if (!productId || !quantity || quantity < 1) {
      throw new Error('Invalid product details in items');
    }

    const menuItem = await MenuItem.findById(productId);
    if (!menuItem) {
      throw new Error(`Menu item ${productId} not found`);
    }

    if (!menuItem.available) {
      throw new Error(`Menu item ${menuItem.name} is currently unavailable`);
    }

    let itemPrice = menuItem.price;
    let modifiersTotal = 0;
    
    if (modifiers && modifiers.length > 0) {
      modifiersTotal = modifiers.reduce((acc, mod) => acc + (mod.price || 0), 0);
    }

    const lineTotal = (itemPrice + modifiersTotal) * quantity;
    subtotal += lineTotal;

    validatedItems.push({
      productId,
      name: menuItem.name,
      unitPrice: itemPrice,
      quantity,
      modifiers: modifiers || [],
      lineTotal
    });
  }

  const taxRate = 0.08;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    total
  };
};

/**
 * Create a new order (Public)
 * POST /api/order
 */
export const createOrder = async (req, res) => {
  try {
    const { tableId, restaurantId, items, notes, clientOrderId } = req.body;

    // 1. Basic validation
    if (!tableId || !restaurantId || !items || !items.length) {
      return res.status(400).json({ error: 'tableId, restaurantId, and items are required' });
    }

    // 2. Validate table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // 3. Idempotency check
    if (clientOrderId) {
      const existingOrder = await Order.findOne({ clientOrderId });
      if (existingOrder) {
        return res.status(200).json(existingOrder);
      }
    }

    // 4. Validate items and compute totals server-side
    const { validatedItems, subtotal, tax, total } = await validateAndCalculateOrder(items);

    // 5. Create order
    const order = new Order({
      tableId,
      restaurantId,
      items: validatedItems,
      subtotal,
      tax,
      total,
      notes: notes || '',
      clientOrderId,
      customerIP: req.ip,
      userAgent: req.get('User-Agent'),
      statusHistory: [{
        status: 'PENDING',
        updatedBy: 'Customer',
        reason: 'Order placed'
      }]
    });

    await order.save();
    res.status(201).json(order);

  } catch (error) {
    console.error('Create Order Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Server error creating order' });
  }
};

/**
 * Get recent orders for a table (Public)
 * GET /api/order/:tableId
 */
export const getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ error: 'Invalid table ID format' });
    }

    const query = { tableId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.set('Cache-Control', 'public, max-age=30');
    res.json(orders);

  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
};

/**
 * Customer cancel order (Public)
 * PATCH /api/order/:orderId/cancel
 */
export const cancelOrderCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (order.createdAt < twoMinutesAgo) {
      return res.status(400).json({ error: 'Cancellation window (2 minutes) has expired. Please contact staff.' });
    }

    order.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      updatedBy: 'Customer',
      reason: 'Customer cancelled'
    });

    await order.save();
    res.json(order);

  } catch (error) {
    res.status(500).json({ error: 'Server error cancelling order' });
  }
};

/**
 * Staff Update Order Status (Authenticated)
 * PATCH /api/order/staff/:orderId/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SERVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status === 'CANCELLED' && !reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    order.status = status;
    if (status === 'CANCELLED') order.cancelReason = reason;

    order.statusHistory.push({
      status,
      updatedBy: req.user._id,
      reason: reason || ''
    });

    await order.save();
    res.json(order);

  } catch (error) {
    res.status(500).json({ error: 'Server error updating status' });
  }
};

/**
 * Staff Edit Order Items (Authenticated)
 * PATCH /api/order/staff/:orderId/items
 */
export const editOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Items can only be edited while order is PENDING' });
    }

    const { validatedItems, subtotal, tax, total } = await validateAndCalculateOrder(items);

    order.editHistory.push({
      updatedBy: req.user._id,
      previousItems: order.items,
      newItems: validatedItems,
      previousTotal: order.total,
      newTotal: total
    });

    order.items = validatedItems;
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;
    if (notes !== undefined) order.notes = notes;

    await order.save();
    res.json(order);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
