/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Tăng giới hạn upload body để hỗ trợ video lớn (600MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '600mb',
    },
  },
};

export default nextConfig;
