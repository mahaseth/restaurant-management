//backend/src/models/Counter.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 'billNumber'
  sequence_value: { type: Number, default: 1000 }
});

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;