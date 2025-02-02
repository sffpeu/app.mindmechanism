/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'types']
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
}

module.exports = nextConfig 