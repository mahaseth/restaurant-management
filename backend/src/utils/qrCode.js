import QRCode from 'qrcode';
import config from '../config/config.js';

export function normalizeAppUrl(appUrl) {
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

const tableQrOptions = {
  errorCorrectionLevel: "H",
  margin: 4,
  width: 512,
  color: { dark: "#000000", light: "#ffffff" },
};

/**
 * Unified guest entry: chat + cart + order for one table scan.
 * @param {string} qrToken
 * @param {{ appUrl?: string }} [opts]
 */
export const buildUnifiedTableSessionUrl = (qrToken, opts = {}) => {
  const appUrl = normalizeAppUrl(opts.appUrl) || normalizeAppUrl(config.appUrl);
  if (!appUrl) {
    throw new Error("APP_URL is not configured and no request Origin was provided.");
  }
  const url = new URL(`/table/qr/${encodeURIComponent(String(qrToken).trim())}`, appUrl);
  return url.toString();
};

/**
 * Single table QR (replaces legacy /order?... and separate AI chat QR).
 * @param {string} qrToken
 * @param {{ appUrl?: string }} [opts]
 * @returns {Promise<{ qrDataUrl: string, qrLink: string }>}
 */
export const generateUnifiedTableQRCode = async (qrToken, opts = {}) => {
  try {
    const qrLink = buildUnifiedTableSessionUrl(qrToken, opts);
    const qrDataUrl = await QRCode.toDataURL(qrLink, tableQrOptions);
    return { qrDataUrl, qrLink };
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    throw new Error("Failed to generate QR code");
  }
};

