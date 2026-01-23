import QRCode from 'qrcode';
import config from '../config/config.js';

/**
 * Generate a QR code for a table ordering link
 * @param {string} tableId - The unique ID of the table
 * @param {string} restaurantId - The unique ID of the restaurant
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
export const generateTableQRCode = async (tableId, restaurantId) => {
  try {
    // Use the app URL from centralized config
    const orderLink = `${config.appUrl}/order?tableId=${tableId}&restaurantId=${restaurantId}`;
    
    // Generate QR code as Data URL (Base64)
    const qrDataUrl = await QRCode.toDataURL(orderLink, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 512,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return qrDataUrl;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw new Error('Failed to generate QR code');
  }
};
