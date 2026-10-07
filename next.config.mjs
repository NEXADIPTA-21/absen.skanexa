/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // HTML5-QRCode works best without double-mounting in dev
  swcMinify: true,
};

export default nextConfig;
