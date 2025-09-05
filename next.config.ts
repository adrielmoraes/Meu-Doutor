import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Adicione a configuração allowedDevOrigins para ambientes de desenvolvimento
  // Adapte a URL para o seu ambiente de desenvolvimento específico
  experimental: {
    allowedDevOrigins: ['https://9000-firebase-studio-1755954095287.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'bluetooth=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
