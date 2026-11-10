/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs', 'sharp'],
  },
  async rewrites() {
    return [
      {
        source: '/hr/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
};

export default nextConfig;
  