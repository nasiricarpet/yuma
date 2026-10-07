/**
 * پیکربندی Next.js پنل ادمین یوما
 *
 * نکات مهم:
 *  - transpilePackages: پکیج‌های داخلی monorepo بدون build جداگانه ترنسپایل می‌شوند.
 *  - optimizePackageImports: importهای lucide-react و recharts را tree-shake می‌کند.
 *  - headers: هدرهای امنیتی پایه برای همه مسیرها.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // پکیج‌های داخلی monorepo باید توسط Next ترنسپایل شوند
  transpilePackages: [
    '@yuma/ui',
    '@yuma/types',
    '@yuma/persian',
    '@yuma/validators',
    '@yuma/config',
  ],

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.yuma.ir' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
