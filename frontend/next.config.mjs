/** @type {import('next').NextConfig} */
const nextConfig = {
  // PrimeReact & PrimeIcons need to be transpiled for Next.js to resolve them
  transpilePackages: ["primereact", "primeicons"],

  // Allow accessing the dev server from your phone/LAN IP.
  // Next will tighten this by default in a future major version.
  allowedDevOrigins: ["192.168.0.154"],
};

export default nextConfig;
