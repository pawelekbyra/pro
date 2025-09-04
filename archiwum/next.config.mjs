/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pawelperfect.pl',
        port: '',
        pathname: '/wp-content/uploads/**',
      }
    ],
  },
};

export default nextConfig;
