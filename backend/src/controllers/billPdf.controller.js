// backend/src/controllers/billPdf.controller.js
import Bill from "../models/Bill.js";
import generateBillPDF from "../utils/generateBillPDF.js";

export const generateBillPDFById = async (req, res) => {
  const bill = await Bill.findById(req.params.id)
  .populate("restaurantId")
  generateBillPDF({
  ...bill.toObject(),
  restaurant: bill.restaurantId
})

  if (!bill) return res.status(404).json({ error: "Bill not found" });

  const pdfDoc = generateBillPDF({
    ...bill.toObject(),
    paymentStatus: bill.status == "paid" ? "Completed" : "Pending"
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=bill.pdf");
  pdfDoc.pipe(res);
  pdfDoc.end();
};
