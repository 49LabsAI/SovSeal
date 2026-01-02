/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  poweredByHeader: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      '@polkadot/util',
      '@polkadot/util-crypto',
      'ethers',
      '@privy-io/react-auth',
    ],
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Stub out unused dependencies from Privy (we only use Ethereum)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Solana - not used
        '@solana-program/system': false,
        '@solana/web3.js': false,
        '@solana/spl-token': false,
        '@solana/wallet-adapter-base': false,
        // Farcaster - not used
        '@farcaster/auth-kit': false,
        // Other unused
        'pino-pretty': false,
      };

      // Alias unused modules to empty
      config.resolve.alias = {
        ...config.resolve.alias,
        // Stub Solana modules
        '@solana-program/system': false,
        '@solana/web3.js': false,
      };
    }

    // Optimize chunks for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Separate vendor chunks for better caching
            polkadot: {
              test: /[\\/]node_modules[\\/]@polkadot[\\/]/,
              name: 'polkadot',
              chunks: 'all',
              priority: 30,
            },
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: 'ethers',
              chunks: 'all',
              priority: 30,
            },
            storacha: {
              test: /[\\/]node_modules[\\/]@storacha[\\/]/,
              name: 'storacha',
              chunks: 'all',
              priority: 30,
            },
            privy: {
              test: /[\\/]node_modules[\\/]@privy-io[\\/]/,
              name: 'privy',
              chunks: 'async', // Load async to not block initial render
              priority: 30,
            },
            ffmpeg: {
              test: /[\\/]node_modules[\\/]@ffmpeg[\\/]/,
              name: 'ffmpeg',
              chunks: 'async', // Load async for lazy loading
              priority: 30,
            },
          },
        },
      };
    }

    return config;
  },

  // Required headers for ffmpeg.wasm (SharedArrayBuffer support)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
