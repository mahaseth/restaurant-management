import Bill from "../models/Bill.js";

async function getNextBillNumber() {
  const lastBill = await Bill.findOne().sort({ billNumber: -1 });
  return lastBill ? lastBill.billNumber + 1 : 1001;
}

export const createBill = async (req, res) => {
  try {
    const {
      items,
      tableNumber,
      orderType,
      discountAmount = 0,
      paymentMethod = "CASH",
    
      paidAmount = 0,
      vatPercent = 13,
      serviceChargePercent = 0,
      
      username = "Admin"
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Items required" });
    }

    const billNumber = await getNextBillNumber();

    // Calculate totals
    let subtotal = 0;
    const billItems = items.map(i => {
      const quantity = parseFloat(i.quantity) || 0;
      const rate = parseFloat(i.rate) || 0;
      const amount = quantity * rate;
      subtotal += amount;
      return { ...i, quantity, rate, amount };
    });

    const vatAmount = (subtotal * vatPercent) / 100;
    const serviceChargeAmount = (subtotal * serviceChargePercent) / 100;
    const totalAmount = subtotal + vatAmount + serviceChargeAmount - discountAmount;

    // Calculate returnAmount
    const paid = parseFloat(paidAmount) || 0;
    const returnAmount = paid - totalAmount > 0 ? paid - totalAmount : 0;

    const bill = new Bill({
      billNumber,
      items: billItems,
      tableNumber,
      orderType,
      discountAmount,
      paymentMethod,
      subtotal,
      vatPercent,
      vatAmount,
      serviceChargePercent,
      serviceChargeAmount,
      totalAmount,
      paidAmount: paid,
      returnAmount,
      status: "paid",
      username,
      createdAt: new Date()
    });

    await bill.save();

    res.status(201).json({
      success: true,
      bill
    });
  } catch (error) {
    res.status(500).json({
      message: "Bill creation failed",
      error: error.message
    });
  }
};
