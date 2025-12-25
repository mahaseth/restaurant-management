import pdfMake from 'pdfmake';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new pdfMake(fonts);

function generateBillPDF(billData) {
  const {
    items = [],
    subtotal = 0,
    vatPercent = 13,
    vatAmount = null,
    serviceChargeAmount = 0,
    discountAmount = 0,
    totalAmount = 0,
    paidAmount = 0,
    returnAmount = 0,
    paymentMethod = "CASH",
    username = "Admin",
    panNo = "",
    regNo = "",
    billNumber = 0,
    createdAt = new Date()
  } = billData;

  const vat = vatAmount !== null ? vatAmount : (subtotal * vatPercent) / 100;

  const dateObj = new Date(createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  const PAPER_WIDTH = 226;
  const PAPER_MARGINS = [5, 5, 5, 5];

  const tableBody = [
    [
      { text: 'S.N.', style: 'tableHeader', bold: true, alignment: 'center' },
      { text: 'ITEMS', style: 'tableHeader', bold: true, alignment: 'left' },
      { text: 'QTY', style: 'tableHeader', bold: true, alignment: 'center' },
      { text: 'AMOUNT', style: 'tableHeader', bold: true, alignment: 'right' }
    ]
  ];

  items.forEach((item, index) => {
    const itemName = item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name;
    const modifiersText = (item.modifiers && item.modifiers.length > 0) ? ` (${item.modifiers.join(', ')})` : '';
    tableBody.push([
      { text: (index + 1).toString(), alignment: 'center', style: 'tableCell' },
      { text: itemName + modifiersText, alignment: 'left', style: 'tableCell' },
      { text: (item.quantity || 0).toString(), alignment: 'center', style: 'tableCell' },
      { text: `Rs. ${(item.amount || 0).toFixed(2)}`, alignment: 'right', style: 'tableCell' }
    ]);
  });

  const docDefinition = {
    pageSize: { width: PAPER_WIDTH, height: 'auto' },
    pageMargins: PAPER_MARGINS,
    content: [
      { text: 'RESTRO X', style: 'restaurantName' },
      { text: 'Kathmandu, Nepal', style: 'restaurantAddress' },
      { text: `PAN: ${panNo}`, style: 'restaurantInfo' },
      { text: '================================', style: 'separator' },
      { text: `Bill No: ${billNumber}`, style: 'billInfo' },
      { text: `Date: ${formattedDate}  Time: ${formattedTime}`, style: 'billInfo' },
      { text: '--------------------------------', style: 'separator' },
      { table: { headerRows: 1, widths: ['12%', '50%', '15%', '23%'], body: tableBody },
        layout: { hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.5 : 0), vLineWidth: () => 0, paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 2, paddingBottom: () => 2 }
      },
      { text: '--------------------------------', style: 'separator' },
      { text: 'BILL SUMMARY', style: 'summaryTitle', alignment: 'center' },
      {
        table: {
          widths: ['65%', '35%'],
          body: [
            [{ text: 'Subtotal:', style: 'summaryLabel' }, { text: `Rs. ${subtotal.toFixed(2)}`, style: 'summaryValue', alignment: 'right' }],
            [{ text: `VAT (${vatPercent}%):`, style: 'summaryLabel' }, { text: `Rs. ${vat.toFixed(2)}`, style: 'summaryValue', alignment: 'right' }],
            ...(serviceChargeAmount > 0 ? [[{ text: 'Service Charge:', style: 'summaryLabel' }, { text: `Rs. ${serviceChargeAmount.toFixed(2)}`, style: 'summaryValue', alignment: 'right' }]] : []),
            ...(discountAmount > 0 ? [[{ text: 'Discount:', style: 'summaryLabel' }, { text: `- Rs. ${discountAmount.toFixed(2)}`, style: 'summaryDiscount', alignment: 'right' }]] : []),
            [{ text: 'Grand Total:', style: 'totalLabel' }, { text: `Rs. ${totalAmount.toFixed(2)}`, style: 'totalValue', alignment: 'right' }],
            [{ text: 'Paid Amount:', style: 'summaryLabel' }, { text: `Rs. ${paidAmount.toFixed(2)}`, style: 'summaryValue', alignment: 'right' }],
            [{ text: 'Return Amount:', style: 'summaryLabel' }, { text: `Rs. ${returnAmount.toFixed(2)}`, style: 'returnAmount', alignment: 'right' }]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10]
      },
      { text: `Payment Method: ${paymentMethod}`, style: 'paymentMethod' },
      { text: '================================', style: 'separatorBold' },
      { text: 'THANK YOU!', style: 'thankYou', alignment: 'center' },
      { text: 'Visit Again Soon!', style: 'thankYouSub', alignment: 'center' },
      { text: `Cashier: ${username}`, style: 'footer' },
      { text: `Printed: ${new Date().toLocaleString('en-IN')}`, style: 'footer' },
      { text: '*** COMPUTER GENERATED BILL ***', style: 'footer', alignment: 'center' },
      { text: ' ', style: 'spacer' },
      { text: '✄ - - - - - - - - - - - - - - - - - - ✄', style: 'cutLine', alignment: 'center' }
    ],
    styles: {
      restaurantName: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
      restaurantAddress: { fontSize: 8, alignment: 'center', margin: [0, 0, 0, 1] },
      restaurantInfo: { fontSize: 7, alignment: 'center', margin: [0, 0, 0, 1] },
      separator: { fontSize: 8, alignment: 'center', margin: [0, 5, 0, 5] },
      separatorBold: { fontSize: 8, alignment: 'center', margin: [0, 8, 0, 8] },
      billInfo: { fontSize: 8, alignment: 'center', margin: [0, 2, 0, 2] },
      tableHeader: { fontSize: 7, fillColor: '#000', color: '#fff', margin: [0, 0, 0, 0] },
      tableCell: { fontSize: 8, margin: [0, 1, 0, 1] },
      summaryTitle: { fontSize: 9, bold: true, margin: [0, 0, 0, 5] },
      summaryLabel: { fontSize: 8, margin: [0, 1, 0, 1] },
      summaryValue: { fontSize: 8, margin: [0, 1, 0, 1] },
      summaryDiscount: { fontSize: 8, margin: [0, 1, 0, 1] },
      totalLabel: { fontSize: 9, bold: true, margin: [0, 3, 0, 3] },
      totalValue: { fontSize: 9, bold: true, margin: [0, 3, 0, 3] },
      returnAmount: { fontSize: 8, bold: true, margin: [0, 1, 0, 1] },
      paymentMethod: { fontSize: 8, bold: true, alignment: 'center', margin: [0, 5, 0, 5] },
      thankYou: { fontSize: 10, bold: true, margin: [0, 5, 0, 3] },
      thankYouSub: { fontSize: 8, margin: [0, 0, 0, 10] },
      footer: { fontSize: 7, margin: [0, 1, 0, 1] },
      spacer: { fontSize: 4, margin: [0, 15, 0, 0] },
      cutLine: { fontSize: 8, margin: [0, 0, 0, 0] }
    },
    defaultStyle: { font: 'Roboto', lineHeight: 1 }
  };

  try {
    return printer.createPdfKitDocument(docDefinition);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

export default generateBillPDF;
