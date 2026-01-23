import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: [true, 'Table number is required'],
    min: [1, 'Table number must be at least 1']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'INACTIVE', 'RESERVED'],
      message: '{VALUE} is not a valid status. Use: ACTIVE, INACTIVE, RESERVED'
    },
    default: 'ACTIVE'
  },
  qrCode: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 4,
    min: [1, 'Capacity must be at least 1']
  }
}, {
  timestamps: true
});

// Compound index for unique table numbers per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);

export default Table;
