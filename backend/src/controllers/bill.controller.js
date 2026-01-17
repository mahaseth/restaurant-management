import Bill from "../models/Bill.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import { getNextBillNumber } from "../utils/getNextBillNumber.js";

export const createBill = async (req, res) => {
  try {
    const {
      items,
      tableNumber,
      orderType,
      discountAmount = 0,
      paymentMethod,
      paidAmount = 0,
      vatPercent = 13,
      serviceChargePercent = 0
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const billNumber = await getNextBillNumber();

    let subtotal = 0;
    const billItems = items.map(i => {
      const qty = Number(i.quantity);
      const rate = Number(i.rate);
      const amount = qty * rate;
      subtotal += amount;
      return { ...i, quantity: qty, rate, amount };
    });

    const vatAmount = subtotal * vatPercent / 100;
    const serviceChargeAmount = subtotal * serviceChargePercent / 100;
    const totalAmount = subtotal + vatAmount + serviceChargeAmount - discountAmount;
    const returnAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;

    const bill = await Bill.create({
      restaurantId: restaurant._id,
      restaurantname: restaurant.res_name,
      restaurantaddress: `${restaurant.address.city}, ${restaurant.address.street}, 
      ${restaurant.address.province}, ${restaurant.address.country}`,
      restaurantphone: restaurant.phoneNo,
      panNo: restaurant.panNo,
      regNo: restaurant.regNo,
      billNumber,
      items: billItems,
      tableNumber,
      orderType,
      paymentMethod,
      subtotal,
      discountAmount,
      vatPercent,
      vatAmount,
      serviceChargePercent,
      serviceChargeAmount,
      totalAmount,
      paidAmount,
      returnAmount,
      status: "paid",
      username: user.name
    });

    res.status(201).json({
      success: true,
      bill,
      pdfUrl: `/api/public/bills/${bill._id}/pdf`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
