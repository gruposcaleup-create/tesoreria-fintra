/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
}

export default nextConfig
// Force restart for Prisma Client update
