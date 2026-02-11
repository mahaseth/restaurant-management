/** @type {import('next').NextConfig} */
const nextConfig = {
  // PrimeReact & PrimeIcons need to be transpiled for Next.js to resolve them
  transpilePackages: ["primereact", "primeicons"],
};

export default nextConfig;
