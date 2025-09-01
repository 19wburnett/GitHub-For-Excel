/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove invalid api.bodyParser option for Next.js 13+
  // Add Vercel-specific optimizations
  swcMinify: true,
  // Ensure proper handling of large files
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
  // Configure for file uploads (handled in API routes)
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  // Increase payload size limits and optimize for large files
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  // Optimize for large payloads
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
