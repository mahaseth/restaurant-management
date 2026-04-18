import Order from "../../../models/Order.js";
import Stripe from "stripe";
import config from "../../../config/config.js";
import { validateAndCalculateOrder, generateOrderNumber } from "../../../utils/orderUtils.js";
import * as tableChatSessionRepo from "../../../repositories/tableChatSession.repository.js";
import { clearSessionCart } from "./tableSessionCart.service.js";

const TERMINAL_STATUSES = ["CLOSED", "CANCELLED", "SERVED", "BILLED"];

async function generateUniqueOrderNumber() {
  for (let i = 0; i < 10; i++) {
    const candidate = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  return `${generateOrderNumber()}-${Date.now()}`;
}

/**
 * If session points at a kitchen-active order, return it; otherwise null.
 */
export async function getBlockingActiveOrder(session) {
  if (!session?.activeOrderId) return null;
  const order = await Order.findById(session.activeOrderId).lean();
  if (!order) return null;
  if (TERMINAL_STATUSES.includes(order.status)) return null;
  return order;
}

export function mapGuestOrderPhase(status) {
  if (!status) return "none";
  if (["PENDING"].includes(status)) return "placed";
  if (["CONFIRMED", "IN_PROGRESS"].includes(status)) return "preparing";
  if (status === "SERVED") return "ready";
  if (["CLOSED", "BILLED", "CANCELLED"].includes(status)) return "completed";
  return "placed";
}

export function serializeOrderForGuest(order) {
  if (!order) return null;
  return {
    _id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    guestPhase: mapGuestOrderPhase(order.status),
    items: order.items || [],
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    notes: order.notes || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Place order from session cart. Clears cart on success. Updates session.activeOrderId.
 */
export async function placeOrderFromSession(session, opts = {}) {
  const {
    notes = "",
    customerEmail = "",
    clientOrderId,
    stripePaymentIntentId,
    req,
  } = opts;

  const blocking = await getBlockingActiveOrder(session);
  if (blocking) {
    const err = new Error("ACTIVE_ORDER_EXISTS");
    err.code = "ACTIVE_ORDER_EXISTS";
    err.order = serializeOrderForGuest(blocking);
    throw err;
  }

  const cart = session.cart;
  const rawItems = Array.isArray(cart?.items) ? cart.items : [];
  if (!rawItems.length) {
    throw new Error("Cart is empty");
  }

  const orderLineItems = rawItems.map((it) => ({
    productId: it.menuItemId,
    quantity: it.quantity,
    modifiers: [],
    restaurantId: session.restaurantId,
  }));

  const { validatedItems, subtotal, tax, total } = await validateAndCalculateOrder(orderLineItems);

  let paymentStatus = "PENDING";
  let paidAt;

  if (stripePaymentIntentId) {
    if (!config.stripe.secretKey) {
      throw new Error("Payment processing is not configured on this server.");
    }
    const stripe = new Stripe(config.stripe.secretKey, { apiVersion: "2024-11-20.acacia" });
    const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    if (pi.status !== "succeeded") {
      throw new Error("Payment has not been completed. Please complete payment before placing the order.");
    }
    const expectedCents = Math.round(total * 100);
    if (Math.abs(pi.amount - expectedCents) > 1) {
      throw new Error("Payment amount does not match order total. Please try again.");
    }
    const dupOrder = await Order.findOne({ stripePaymentIntentId });
    if (dupOrder) {
      await tableChatSessionRepo.setActiveOrder(session._id, dupOrder._id, dupOrder.status);
      await clearSessionCart(session.sessionToken);
      return dupOrder;
    }
    paymentStatus = "PAID";
    paidAt = new Date();
  }

  if (clientOrderId) {
    const existing = await Order.findOne({ clientOrderId });
    if (existing) {
      await tableChatSessionRepo.setActiveOrder(session._id, existing._id, existing.status);
      await clearSessionCart(session.sessionToken);
      return existing;
    }
  }

  const orderNumber = await generateUniqueOrderNumber();
  const order = new Order({
    orderNumber,
    tableId: session.tableId,
    restaurantId: session.restaurantId,
    customerEmail: typeof customerEmail === "string" ? customerEmail.trim().slice(0, 200) : "",
    items: validatedItems,
    subtotal,
    tax,
    total,
    notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
    clientOrderId: clientOrderId || undefined,
    stripePaymentIntentId: stripePaymentIntentId || undefined,
    paymentStatus,
    paidAt,
    customerIP: req?.ip || "",
    userAgent: req?.get?.("User-Agent") || "",
    statusHistory: [
      {
        status: "PENDING",
        updatedBy: "Customer",
        reason: stripePaymentIntentId ? "Order placed with online payment (table session)" : "Order placed from table session",
      },
    ],
  });

  await order.save();

  await tableChatSessionRepo.setActiveOrder(session._id, order._id, order.status);
  await tableChatSessionRepo.saveCart(session._id, { items: [], subtotal: 0, updatedAt: new Date() });

  return order;
}

export async function getOrderStatusForSession(session) {
  if (!session?.activeOrderId) {
    return { activeOrder: null, guestPhase: "none", lastOrderStatus: session?.lastOrderStatus || "" };
  }
  const order = await Order.findById(session.activeOrderId).lean();
  if (!order) {
    await tableChatSessionRepo.clearActiveOrder(session._id);
    return { activeOrder: null, guestPhase: "none", lastOrderStatus: "" };
  }
  return {
    activeOrder: serializeOrderForGuest(order),
    guestPhase: mapGuestOrderPhase(order.status),
    lastOrderStatus: order.status,
  };
}
