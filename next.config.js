// Sur Vercel, ne pas utiliser `output: 'standalone'` : l’hébergeur gère le déploiement
// et cette option alourdit fortement « Collecting build traces » (risque d’OOM / timeout).
const nextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
    optimizePackageImports: ['lucide-react'],
  },
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  // En dev, un maxInactiveAge trop bas expulse des chunks du cache et provoque
  // "Cannot find module './xxxx.js'" au prochain chargement (webpack-runtime désynchronisé).
  onDemandEntries: {
    maxInactiveAge: 5 * 60 * 1000,
    pagesBufferLength: 8,
  },
  async headers() {
    // Ne pas appliquer CORS sur tout le site : en dev, cela peut perturber le chargement
    // des chunks /_next (127.0.0.1 vs [::1] vs localhost). CORS limité aux routes API.
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
