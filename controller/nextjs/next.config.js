/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for development with API routes
  distDir: 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig