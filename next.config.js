/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove X-Powered-By: Next.js header to avoid leaking stack info
  poweredByHeader: false,
};
module.exports = nextConfig;
