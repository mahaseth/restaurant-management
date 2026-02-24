import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import mongoose from 'mongoose';
import { generateOrderNumber, validateAndCalculateOrder } from "../utils/orderUtils.js";

async function generateUniqueOrderNumber() {
  // Best-effort uniqueness; orderNumber has a unique index as final guard.
  for (let i = 0; i < 10; i++) {
    const candidate = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  // Extremely unlikely fallback
  return `${generateOrderNumber()}-${Date.now()}`;
}

/**
 * Create a new order (Public)
 * POST /api/order
 */
export const createOrder = async (req, res) => {
  try {
    const { tableId, restaurantId, items, notes, clientOrderId, customerEmail } = req.body;

    // 1. Basic validation
    if (!tableId || !restaurantId || !items || !items.length) {
      return res.status(400).json({ error: 'tableId, restaurantId, and items are required' });
    }

    // 2. Validate table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Enforce table -> restaurant relationship for public requests
    if (String(table.restaurantId) !== String(restaurantId)) {
      return res.status(400).json({ error: "Table does not belong to this restaurant" });
    }

    // 3. Idempotency check
    if (clientOrderId) {
      const existingOrder = await Order.findOne({ clientOrderId });
      if (existingOrder) {
        return res.status(200).json(existingOrder);
      }
    }

    // 4. Validate items and compute totals server-side
    // Attach restaurantId to each item for validation function checks.
    const itemsWithRestaurant = items.map((it) => ({ ...it, restaurantId }));
    const { validatedItems, subtotal, tax, total } = await validateAndCalculateOrder(itemsWithRestaurant);

    // 5. Create order
    const orderNumber = await generateUniqueOrderNumber();
    const order = new Order({
      orderNumber,
      tableId,
      restaurantId,
      customerEmail: customerEmail || "",
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
    // Cancellation from the customer QR flow is intentionally disabled.
    // Customers may only add more items to an existing order.
    return res.status(403).json({ error: "Customer cancellation is disabled. Please contact staff." });
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

    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SERVED', 'CANCELLED', 'BILLED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status === 'CANCELLED' && !reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    order.status = status;
    if (status === 'CANCELLED') order.cancelReason = reason;
    if (status === "CLOSED") {
      if (!order.closedAt) order.closedAt = new Date();
      // Closing an order implies payment is settled.
      if (order.paymentStatus !== "PAID") {
        order.paymentStatus = "PAID";
        if (!order.paidAt) order.paidAt = new Date();
      }
    }

    // If this order had customer additions waiting, any staff status update is an acknowledgment.
    // (Most commonly staff sets CONFIRMED again.)
    if (order.pendingAdditions && status !== "PENDING") {
      order.pendingAdditions = false;
      order.pendingAdditionsAt = undefined;
    }

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
 * Staff Update Order Payment Status (Authenticated)
 * PATCH /api/order/staff/:orderId/payment-status
 */
export const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!["PENDING", "PAID"].includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paymentStatus = paymentStatus;
    if (paymentStatus === "PAID") {
      if (!order.paidAt) order.paidAt = new Date();
    } else {
      order.paidAt = undefined;
    }

    order.statusHistory.push({
      status: `PAYMENT_${paymentStatus}`,
      updatedBy: req.user._id,
      reason: "",
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Server error updating payment status" });
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

    // Staff edited the order; clear any pending additions flag.
    if (order.pendingAdditions) {
      order.pendingAdditions = false;
      order.pendingAdditionsAt = undefined;
    }

    await order.save();
    res.json(order);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Staff: Get recent orders for the restaurant
 * GET /api/order/staff/recent
 */
export const getRecentOrdersStaff = async (req, res) => {
  try {
    const { status, limit = 50, tableId, sinceHours } = req.query;

    const query = {
      restaurantId: req.restaurant?._id,
    };

    if (status) query.status = status;
    if (tableId) {
      if (!mongoose.Types.ObjectId.isValid(tableId)) {
        return res.status(400).json({ error: "Invalid table ID format" });
      }
      query.tableId = tableId;
    }

    // Default window is last 2 hours (matches staff Orders page).
    // Use sinceHours=0 to disable time filtering ("all time").
    const parsedSinceHours = sinceHours === undefined || sinceHours === null || sinceHours === ""
      ? 2
      : Number(sinceHours);
    if (Number.isFinite(parsedSinceHours) && parsedSinceHours > 0) {
      query.createdAt = { $gte: new Date(Date.now() - parsedSinceHours * 60 * 60 * 1000) };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 200))
      .populate("tableId", "tableNumber")
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Recent Orders (Staff) Error:", error);
    res.status(500).json({ error: "Server error fetching orders" });
  }
};

/**
 * Staff: Get single order with details
 * GET /api/order/staff/:orderId
 */
export const getOrderByIdStaff = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.restaurant?._id,
    })
      .populate("tableId", "tableNumber")
      .lean();

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    console.error("Get Order (Staff) Error:", error);
    res.status(500).json({ error: "Server error fetching order" });
  }
};
