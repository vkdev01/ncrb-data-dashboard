/**
 * Next.js config — static export for GitHub Pages.
 *
 * The app is deployed as a *project* site at
 *   https://<user>.github.io/ncrb-data-dashboard/
 * so production builds need a basePath. Dev keeps the root path.
 */
const REPO = 'ncrb-data-dashboard';
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? `/${REPO}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',            // fully static — no server needed
  trailingSlash: true,         // GitHub Pages serves /about/ from /about/index.html
  images: { unoptimized: true },
  basePath,
  experimental: { cpus: 1, workerThreads: false },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
