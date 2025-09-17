/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for development with API routes
  // distDir: 'dist', // Using default .next directory to avoid permission issues
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig