import QRCode from 'qrcode';
import config from '../config/config.js';

function normalizeAppUrl(appUrl) {
  const raw = String(appUrl || "").trim();
  if (!raw) return "";
  // Ensure no trailing slash so we don't produce `//order`.
  const noSlash = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  // If someone configured "192.168.0.154:3000" without scheme, default to http://
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(noSlash)) {
    return `http://${noSlash}`;
  }
  return noSlash;
}

/**
 * Generate a QR code for a table ordering link
 * @param {string} tableId - The unique ID of the table
 * @param {string} restaurantId - The unique ID of the restaurant
 * @param {{ appUrl?: string }} [opts]
 * @returns {Promise<{ qrDataUrl: string, orderLink: string }>}
 */
export const generateTableQRCode = async (tableId, restaurantId, opts = {}) => {
  try {
    // Prefer the calling request's Origin (frontend URL) when available.
    // This makes QR codes work for both:
    // - PC testing (http://localhost:3000)
    // - Phone/Wi-Fi testing (http://<LAN-IP>:3000)
    const appUrl = normalizeAppUrl(opts.appUrl) || normalizeAppUrl(config.appUrl);
    if (!appUrl) {
      throw new Error("APP_URL is not configured and no request Origin was provided.");
    }

    // Always generate a fully-qualified URL (never a relative "/order?...").
    const url = new URL("/order", appUrl);
    url.searchParams.set("tableId", String(tableId));
    url.searchParams.set("restaurantId", String(restaurantId));
    const orderLink = url.toString();
    
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

    return { qrDataUrl, orderLink };
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw new Error('Failed to generate QR code');
  }
};
