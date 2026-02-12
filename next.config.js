
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
        'localhost:3000',
        'localhost:6000',
        'localhost:9000',
        '*.cloudworkstations.dev',
        '*.firebaseapp.com',
        '*.web.app',
        '*.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev'
      ],
    },
  },
};

module.exports = nextConfig;
