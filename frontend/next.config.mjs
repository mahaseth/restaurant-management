/** @type {import('next').NextConfig} */
const nextConfig = {
  // PrimeReact & PrimeIcons need to be transpiled for Next.js to resolve them
  transpilePackages: ["primereact", "primeicons"],

  // Allow dev WebSocket (HMR) when you open the app via a LAN IP, not only localhost.
  // Add your PC’s current Wi‑Fi/Ethernet address if HMR fails from another device.
  allowedDevOrigins: ["192.168.0.154", "192.168.40.1"],
};

export default nextConfig;
