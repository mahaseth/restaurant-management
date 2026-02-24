import mongoose from "mongoose";
import Table from "../models/Table.js";
import Order from "../models/Order.js";
import { calculateTotalsFromItems, mergeOrderItems, validateAndCalculateOrder } from "../utils/orderUtils.js";

// Public table info endpoint for QR ordering.
// GET /api/public/table/:tableId?restaurantId=...
export const getPublicTableInfo = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { restaurantId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ error: "Invalid tableId format." });
    }
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: "Valid restaurantId is required." });
    }

    const table = await Table.findById(tableId).lean();
    if (!table) return res.status(404).json({ error: "Table not found." });

    if (String(table.restaurantId) !== String(restaurantId)) {
      return res.status(404).json({ error: "Table not found for this restaurant." });
    }

    // Only return the fields needed by the customer UI.
    return res.status(200).json({
      _id: table._id,
      tableNumber: table.tableNumber,
      status: table.status,
      capacity: table.capacity,
      restaurantId: table.restaurantId,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching table info." });
  }
};

// Public read-only order lookup by customer-visible order number.
// GET /api/public/order/:orderNumber?tableId=...&restaurantId=...
export const getPublicOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { tableId, restaurantId } = req.query;

    if (!orderNumber || typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Valid orderNumber is required." });
    }
    if (!tableId || !mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ error: "Valid tableId is required." });
    }
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: "Valid restaurantId is required." });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      tableId,
      restaurantId,
    }).lean();

    if (!order) return res.status(404).json({ error: "Order not found." });

    // Only return fields needed by the customer UI.
    return res.status(200).json({
      _id: order._id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      status: order.status,
      statusHistory: order.statusHistory || [],
      items: order.items || [],
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      notes: order.notes || "",
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("Get Public Order Error:", error);
    res.status(500).json({ error: "Server error fetching order." });
  }
};

// Customer adds more items to an existing order using the order number.
// PATCH /api/public/order/:orderNumber/items
export const addItemsToPublicOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { tableId, restaurantId, items, notes, customerEmail } = req.body || {};

    if (!orderNumber || typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Valid orderNumber is required." });
    }
    if (!tableId || !mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ error: "Valid tableId is required." });
    }
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: "Valid restaurantId is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items are required." });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      tableId,
      restaurantId,
    });
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (["CANCELLED", "SERVED", "BILLED"].includes(order.status)) {
      return res.status(400).json({ error: `Cannot add items when order is ${order.status}.` });
    }

    // Validate new items and merge with existing.
    const itemsWithRestaurant = items.map((it) => ({ ...it, restaurantId }));
    const { validatedItems: newValidated } = await validateAndCalculateOrder(itemsWithRestaurant);
    const mergedItems = mergeOrderItems(order.items, newValidated);
    const { subtotal, tax, total } = calculateTotalsFromItems(mergedItems);

    // Audit entry
    order.editHistory.push({
      // updatedBy intentionally omitted for public updates
      previousItems: order.items,
      newItems: mergedItems,
      previousTotal: order.total,
      newTotal: total,
    });

    order.items = mergedItems;
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;
    if (typeof notes === "string") order.notes = notes;
    if (typeof customerEmail === "string" && customerEmail.trim()) order.customerEmail = customerEmail.trim();

    // Staff needs to re-confirm additions (acts as a "notification" flag for the UI).
    order.pendingAdditions = true;
    order.pendingAdditionsAt = new Date();

    order.statusHistory.push({
      status: order.status,
      updatedBy: "Customer",
      reason: "Customer added items (pending staff confirmation)",
    });

    await order.save();

    return res.status(200).json({
      _id: order._id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      status: order.status,
      statusHistory: order.statusHistory || [],
      items: order.items || [],
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      notes: order.notes || "",
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("Add Items Public Error:", error);
    res.status(400).json({ error: error.message || "Server error updating order." });
  }
};

