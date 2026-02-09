/** @type {import('next').NextConfig} */
const nextConfig = {
  // CTO: Adiciona 'cmdk' para transpilação para resolver SyntaxError/ChunkLoadError
  // Isso garante que o pacote seja processado corretamente pelo Next.js,
  // evitando erros de sintaxe em ambientes de execução mais restritivos ou bundles corrompidos.
  transpilePackages: ['cmdk'],
  // Outras configurações do Next.js podem ser adicionadas aqui, se necessário.
};
export default nextConfig;