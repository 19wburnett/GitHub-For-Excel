/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for static deployment
  swcMinify: true,
  // Ensure proper handling of client-side dependencies
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
}

module.exports = nextConfig
