/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Rewrite barrel imports (`import { X } from 'lucide-react'`) to per-icon
    // modules so dev compiles a handful of icons, not all ~4,300 of them.
    // Note: listing these under `transpilePackages` defeats this optimisation.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
