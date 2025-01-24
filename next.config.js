/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'types']
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
}

module.exports = nextConfig 