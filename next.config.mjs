/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // WebP only: Next 14's AVIF image-optimizer path has open advisories, and
  // every image on this site is local, so AVIF buys little.
  images: {
    formats: ['image/webp'],
  },
};

export default nextConfig;
