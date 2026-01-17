// backend/src/controllers/report.controller.js
import Bill from "../models/Bill.js";

export const dailySales = async (req, res) => {
  const start = new Date(req.query.date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const result = await Bill.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lt: end }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalAmount" },
        totalVat: { $sum: "$vatAmount" },
        totalDiscount: { $sum: "$discountAmount" },
        bills: { $sum: 1 }
      }
    }
  ]);

  res.json(result[0] || {});
};
