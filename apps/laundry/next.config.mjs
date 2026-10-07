/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@yuma/ui', '@yuma/persian', '@yuma/validators', '@yuma/types', '@yuma/config'],
};

export default nextConfig;
