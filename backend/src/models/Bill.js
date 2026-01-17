import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
    index: true
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    lineTotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PAID'],
    default: 'UNPAID',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'ONLINE', 'OTHER'],
    default: 'CASH'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique bill numbers per restaurant
billSchema.index({ restaurantId: 1, billNumber: 1 }, { unique: true });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
