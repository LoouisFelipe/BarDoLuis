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
  // Configuração para permitir conexões via Cloud Workstation e porta 3000
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.cloudworkstations.dev',
        '*.firebaseapp.com',
        '*.web.app'
      ],
    },
  },
};

module.exports = nextConfig;