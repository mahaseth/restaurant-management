//backend/src/utils/generateKitchenPDF.js
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

function generateKitchenPDF(billData) {
  const {
    items = [],
    tableNumber = "N/A",
    orderType = "N/A",
    username = "Admin",
    restaurantname = "RESTRO X KITCHEN",
    restaurantaddress = "Kathmandu, Nepal",
    createdAt = new Date(),
    billNumber = "N/A",
    customerName = "",
    specialInstructions = ""
  } = billData;

  const dateObj = new Date(createdAt);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  
  const formattedTime = dateObj.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // Prepare table body
  const tableBody = items.map((item, index) => {
    const itemName = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
    const modifiers = item.modifiers && item.modifiers.length ? `\n[${item.modifiers.join(", ")}]` : '';
    return [
      { 
        text: (index + 1).toString(), 
        style: 'tableCell',
        alignment: 'center' 
      },
      { 
        text: itemName + modifiers, 
        style: 'tableCell',
        alignment: 'left' 
      },
      { 
        text: (item.quantity || 0).toString(), 
        style: 'tableCell',
        alignment: 'center' 
      }
    ];
  });

  // Add table header
  tableBody.unshift([
    { 
      text: 'S.N', 
      style: 'tableHeader',
      bold: true,
      alignment: 'center' 
    },
    { 
      text: 'ITEM NAME', 
      style: 'tableHeader',
      bold: true,
      alignment: 'left' 
    },
    { 
      text: 'QTY', 
      style: 'tableHeader',
      bold: true,
      alignment: 'center' 
    }
  ]);

  const docDefinition = {
    pageSize: { 
      width: 226, // 80mm thermal paper width
      height: 'auto' 
    },
    pageMargins: [8, 8, 8, 8],
    content: [
      // Restaurant Header
      { 
        text: `${restaurantname}`, 
        style: 'restaurantHeader',
        alignment: 'center' 
      },
      { 
        text: 'KITCHEN ORDER SLIP', 
        style: 'kitchenHeader',
        alignment: 'center' 
      },
      
      // Separator line
      { 
        canvas: [{ 
          type: 'line', 
          x1: 0, y1: 0, 
          x2: 210, y2: 0, 
          lineWidth: 1.5,
          lineColor: '#000000' 
        }],
        margin: [0, 2, 0, 8]
      },
      
      // Order Information
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: `Bill No.: ${billNumber}`, style: 'orderInfo' },
              { text: `Table: ${tableNumber}`, style: 'orderInfo' }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: `Type: ${orderType}`, style: 'orderInfo' },
              { text: `Date: ${formattedDate}`, style: 'orderInfo' }
            ]
          }
        ]
      },
      
      { text: `Time: ${formattedTime}`, style: 'orderInfo' },
      
      // Customer info if available
      ...(customerName ? [{ text: `Customer: ${customerName}`, style: 'customerInfo' }] : []),
      
      // Special Instructions
      ...(specialInstructions ? [
        { text: 'Special Instructions:', style: 'instructionsLabel' },
        { 
          text: specialInstructions, 
          style: 'instructionsText',
          margin: [0, 0, 0, 8]
        }
      ] : []),
      
      // Separator
      { 
        canvas: [{ 
          type: 'line', 
          x1: 0, y1: 0, 
          x2: 210, y2: 0, 
          lineWidth: 0.5,
          lineColor: '#666666' 
        }],
        margin: [0, 0, 0, 8]
      },
      
      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['12%', '70%', '18%'],
          body: tableBody
        },
        layout: {
          hLineWidth: function(i, node) {
            return i === 0 ? 1 : 0; // Only top border for header
          },
          vLineWidth: function() {
            return 0; // No vertical lines
          },
          paddingTop: function(i) {
            return i === 0 ? 4 : 3;
          },
          paddingBottom: function(i) {
            return i === 0 ? 4 : 3;
          }
        },
        margin: [0, 0, 0, 10]
      },
      
      // Separator
      { 
        canvas: [{ 
          type: 'line', 
          x1: 0, y1: 0, 
          x2: 210, y2: 0, 
          lineWidth: 0.5,
          lineColor: '#666666' 
        }],
        margin: [0, 0, 0, 8]
      },
      
      // Order Summary
      { 
        text: `Total Items: ${items.length}`, 
        style: 'summaryText',
        bold: true 
      },
      { 
        text: `Received By: ${username}`, 
        style: 'summaryText' 
      },
      
      // Separator
      { 
        canvas: [{ 
          type: 'line', 
          x1: 0, y1: 0, 
          x2: 210, y2: 0, 
          lineWidth: 0.5,
          lineColor: '#666666' 
        }],
        margin: [0, 8, 0, 8]
      },
      
      // Kitchen Notes
      { 
        text: 'KITCHEN NOTES:', 
        style: 'notesHeader',
        bold: true 
      },
      { 
        text: '________________________________', 
        style: 'notesLine' 
      },
      { 
        text: '________________________________', 
        style: 'notesLine' 
      },
      { 
        text: '________________________________', 
        style: 'notesLine',
        margin: [0, 0, 0, 5]
      },
      
      // Footer
      { 
        text: '*** KEEP THIS SLIP IN KITCHEN ***', 
        style: 'footer',
        alignment: 'center' 
      },
      
      // Cut line indicator
      { 
        text: '✄ - - - - - - - - - - - - - - - - - - ✄', 
        style: 'cutLine',
        alignment: 'center',
        margin: [0, 15, 0, 0]
      }
    ],
    styles: {
      // Header Styles
      restaurantHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 2]
      },
      kitchenHeader: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 5]
      },
      
      // Order Information
      orderInfo: {
        fontSize: 8,
        margin: [0, 1, 0, 1]
      },
      customerInfo: {
        fontSize: 8,
        bold: true,
        margin: [0, 3, 0, 3]
      },
      
      // Instructions
      instructionsLabel: {
        fontSize: 8,
        bold: true,
        margin: [0, 5, 0, 2]
      },
      instructionsText: {
        fontSize: 8,
        italics: true,
        color: '#d35400'
      },
      
      // Table Styles
      tableHeader: {
        fontSize: 8,
        fillColor: '#f8f9fa',
        margin: [0, 0, 0, 0]
      },
      tableCell: {
        fontSize: 8,
        margin: [0, 2, 0, 2]
      },
      
      // Summary
      summaryText: {
        fontSize: 8,
        margin: [0, 1, 0, 1]
      },
      
      // Notes
      notesHeader: {
        fontSize: 8,
        margin: [0, 0, 0, 5]
      },
      notesLine: {
        fontSize: 8,
        color: '#cccccc',
        margin: [0, 0, 0, 2]
      },
      
      // Footer
      footer: {
        fontSize: 7,
        margin: [0, 10, 0, 5]
      },
      
      // Cut line
      cutLine: {
        fontSize: 8,
        color: '#999999'
      }
    },
    defaultStyle: {
      font: 'Roboto',
      lineHeight: 1.1
    }
  };

  try {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return pdfDoc;
  } catch (error) {
    console.error('Kitchen PDF Generation Error:', error);
    throw error;
  }
}

export default generateKitchenPDF;