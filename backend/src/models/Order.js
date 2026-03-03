import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Product ID is required']
  },
  // Snapshot fields (capture current values at order time)
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  // Optional: modifiers/addons
  modifiers: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 }
  }],
  // Calculated field
  lineTotal: {
    type: Number,
    required: [true, 'Line total is required'],
    min: [0, 'Line total cannot be negative']
  }
}, { _id: false }); // No separate _id for subdocuments

const orderSchema = new mongoose.Schema({
  // Customer-visible order number (used for "existing order" flow).
  // Example: RS-7K4P9D2A
  orderNumber: {
    type: String,
    required: [true, "Order number is required"],
    unique: true,
    index: true,
    trim: true,
  },
  // Source/type of order (QR dine-in vs staff walk-in takeaway).
  orderType: {
    type: String,
    enum: {
      values: ["DINE_IN", "TAKEAWAY"],
      message: "{VALUE} is not a valid order type",
    },
    default: "DINE_IN",
    index: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: function requiredTableId() {
      return this.orderType !== "TAKEAWAY";
    },
    index: true
  },
  // For takeaway / counter orders
  walkInName: {
    type: String,
    trim: true,
    maxlength: [120, "Name cannot exceed 120 characters"],
    default: "",
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  // Optional: captured from customer on QR flow start screen.
  // Not used for auth; purely for sending updates/identification later.
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: "",
    maxlength: [200, "Email cannot exceed 200 characters"],
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SERVED', 'CANCELLED', 'BILLED', 'CLOSED'],
      message: '{VALUE} is not a valid status'
    },
    default: 'PENDING',
    index: true
  },
  // Payment is tracked separately from kitchen/service status.
  // Default is pending; staff can mark paid, and closing an order auto-marks paid.
  paymentStatus: {
    type: String,
    enum: {
      values: ["PENDING", "PAID"],
      message: "{VALUE} is not a valid payment status",
    },
    default: "PENDING",
    index: true,
  },
  paidAt: {
    type: Date,
  },
  // When the table is freed up (final state).
  closedAt: {
    type: Date,
  },
  // When a customer adds more items to an existing order, staff should re-confirm.
  // This flag is a simple "notification" for the staff UI.
  pendingAdditions: {
    type: Boolean,
    default: false,
    index: true,
  },
  pendingAdditionsAt: {
    type: Date,
  },
  // Link to Bill
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    index: true
  },
  // Totals (calculated server-side)
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  // Optional fields
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  // Idempotency key (prevent duplicate orders)
  clientOrderId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values, but enforce uniqueness when present
    index: true
  },
  // Metadata
  customerIP: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  // Cancellation details
  cancelReason: {
    type: String,
    trim: true,
    default: ''
  },
  // Audit Trail & History
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'SYSTEM' }, // Can be 'Customer' or User ID
    reason: String
  }],
  editHistory: [{
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousItems: [orderItemSchema],
    newItems: [orderItemSchema],
    previousTotal: Number,
    newTotal: Number
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound indexes for efficient queries
orderSchema.index({ tableId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderType: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
