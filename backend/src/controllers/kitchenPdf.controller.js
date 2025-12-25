import generateKitchenPDF from "../utils/generateKitchenPDF.js";
import Bill from "../models/Bill.js";


export const generateKitchenPDFById = async (req, res) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  const pdfDoc = generateKitchenPDF(bill);

  res.setHeader("Content-Type", "application/pdf");
  pdfDoc.pipe(res);
  pdfDoc.end();
};

