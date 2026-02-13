/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        '*.cloudworkstations.dev',
        '*.firebaseapp.com',
        '*.web.app',
        '*.cluster-*.cloudworkstations.dev'
      ],
    },
  },
};

module.exports = nextConfig;
