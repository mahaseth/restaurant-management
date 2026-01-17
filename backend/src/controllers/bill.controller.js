import Bill from '../models/Bill.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import generateBillPDF from '../utils/generateBillPDF.js';
import mongoose from 'mongoose';

// Get preview of unbilled orders for a table
export const getBillPreview = async (req, res) => {
  try {
    const { tableId } = req.params;
    const restaurantId = req.restaurant._id;

    // Find all SERVED orders for this table that are not billed
    const orders = await Order.find({
      tableId,
      restaurantId,
      status: 'SERVED',
      billId: { $exists: false }
    });

    if (!orders.length) {
      return res.status(404).json({ message: 'No unbilled orders found for this table' });
    }

    // Aggregate items
    const aggregatedItems = {};
    let subtotal = 0;
    let tax = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId.toString() + (item.modifiers?.map(m => m.name).join(',') || '');
        if (aggregatedItems[key]) {
          aggregatedItems[key].quantity += item.quantity;
          aggregatedItems[key].lineTotal += item.lineTotal;
        } else {
          aggregatedItems[key] = {
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          };
        }
      });
      subtotal += order.subtotal;
      tax += order.tax;
    });

    const total = subtotal + tax;

    res.json({
      tableId,
      orderIds: orders.map(o => o._id),
      items: Object.values(aggregatedItems),
      subtotal,
      tax,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { tableId, orderIds, discount = 0 } = req.body;
    const restaurantId = req.restaurant._id;

    // Verify orders are valid and belong to this table/restaurant and are not billed
    const orders = await Order.find({
      _id: { $in: orderIds },
      tableId,
      restaurantId,
      billId: { $exists: false }
    });

    if (orders.length !== orderIds.length) {
      return res.status(400).json({ message: 'One or more orders are invalid or already billed' });
    }

    // Aggregate items and calculate totals
    const aggregatedItems = {};
    let subtotal = 0;
    let tax = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId.toString() + (item.modifiers?.map(m => m.name).join(',') || '');
        if (aggregatedItems[key]) {
          aggregatedItems[key].quantity += item.quantity;
          aggregatedItems[key].lineTotal += item.lineTotal;
        } else {
          aggregatedItems[key] = {
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          };
        }
      });
      subtotal += order.subtotal;
      tax += order.tax;
    });

    const totalBeforeDiscount = subtotal + tax;
    const finalTotal = totalBeforeDiscount - discount;

    // Generate bill number (TEMPORARY simple version)
    const billCount = await Bill.countDocuments({ restaurantId });
    const billNumber = `BILL-${Date.now()}-${billCount + 1}`;

    const bill = new Bill({
      billNumber,
      restaurantId,
      tableId,
      orderIds,
      items: Object.values(aggregatedItems),
      subtotal,
      tax,
      discount,
      total: finalTotal,
      createdBy: req.user._id
    });

    await bill.save();

    // Link orders to bill
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { billId: bill._id } }
    );

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark bill as paid
export const payBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const restaurantId = req.restaurant._id;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { billNumber: id };

    const bill = await Bill.findOne({ ...query, restaurantId });
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status === 'PAID') {
      return res.status(400).json({ message: 'Bill is already paid' });
    }

    bill.status = 'PAID';
    bill.paymentMethod = paymentMethod || 'CASH';
    await bill.save();

    // Update orders to BILLED status
    await Order.updateMany(
      { _id: { $in: bill.orderIds } },
      { $set: { status: 'BILLED' } }
    );

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Print bill (Generate PDF)
export const printBill = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurant._id;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { billNumber: id };

    const bill = await Bill.findOne({ ...query, restaurantId }).populate('tableId');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Pass data to the enhanced utility
    const pdfData = {
      items: bill.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        rate: item.unitPrice
      })),
      billNumber: bill.billNumber,
      tableNumber: bill.tableId?.tableNumber || 'N/A',
      taxAmount: bill.tax,
      discountAmount: bill.discount,
      totalPaid: bill.status === 'PAID' ? bill.total : 0,
      username: req.user.name || 'Staff',
      panNo: '123456789',
      regNo: 'REG987654321'
    };

    const pdfDoc = generateBillPDF(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=bill-${bill.billNumber}.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};