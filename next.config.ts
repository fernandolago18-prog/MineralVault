import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imágenes de Mindat.org (para thumbnails si están disponibles)
      { protocol: 'https', hostname: 'www.mindat.org' },
      { protocol: 'https', hostname: 'images.mindat.org' },
      // Google Drive thumbnails
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
    ],
  },
  // Three.js requiere que algunos módulos se traten como externos en SSR
  serverExternalPackages: ['three'],
}

export default nextConfig
