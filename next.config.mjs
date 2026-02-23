/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Mantém o sistema rodando sem erro de sintaxe (Vital)
  transpilePackages: ['cmdk'],

  // 2. Configuração de Imagens (Picsum)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  // 3. SEGURANÇA: Libera os endereços da Cloud Workstation
  experimental: {
    // CTO: Permite que a Cloud Workstation acesse os recursos do Next.js sem erros de Cross-Origin
    allowedDevOrigins: [
      '8080-firebase-bardoluiss-1770055778576.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev'
    ],
    serverActions: {
      allowedOrigins: [
        '8080-firebase-bardoluiss-1770055778576.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev',
        '3000-firebase-bardoluiss-1770055778576.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev',
        'localhost:8080',
        'localhost:3000',
      ],
    },
  },
};

export default nextConfig;