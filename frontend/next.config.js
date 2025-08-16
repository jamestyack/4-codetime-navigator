/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://your-render-app.onrender.com/:path*'
          : 'http://localhost:8001/:path*',
      },
    ]
  },
  experimental: {
    proxyTimeout: 300000, // 5 minutes timeout
  },
}

module.exports = nextConfig