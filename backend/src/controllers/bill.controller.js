import generateBillPDF from '../utils/generateBillPDF.js';
const generateBill = async (req, res) => {
  try {
    const {
      items,           // Array: [{ name, quantity, rate }]
      discountPercent, // e.g., 10 for 10%
      totalPaid,       // amount paid by customer
      username         // from req.user or session
    } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const billData = {
      items,
      vatPercent: 13,
      discountPercent: parseFloat(discountPercent) || 0,
      totalPaid: parseFloat(totalPaid) || 0,
      username: username || 'Admin',
      panNo: '123456789',     // ← Replace with real value or from DB/env
      regNo: 'REG987654321'   // ← Replace with real value
    };

    const pdfDoc = generateBillPDF(billData);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=bill.pdf'); // or 'attachment' to force download

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate bill' });
  }
};
export {generateBill};