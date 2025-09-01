/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir as it's now stable in Next.js 13+
  // Keep bodyParser: false for file uploads
  api: {
    bodyParser: false,
  },
  // Add Vercel-specific optimizations
  swcMinify: true,
  // Ensure proper handling of large files
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
}

module.exports = nextConfig
