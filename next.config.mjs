/** @type {import('next').NextConfig} */
const nextConfig = {
  // CTO: Permite que a Cloud Workstation acesse os recursos do Next.js sem erros de Cross-Origin
  experimental: {
    allowedDevOrigins: [
      '8080-firebase-bardoluiss-1770055778576.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev'
    ]
  },
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
  // Adicionei tanto a porta 3000 quanto a 8080 para garantir.
  experimental: {
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