/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone',

  // Tell Next.js to treat these as external Node.js modules and NOT bundle them
  serverExternalPackages: ['contentful-cli', 'contentful-management', '@prisma/client', 'prisma'],

  experimental: {
    // Faster compilation for large component libraries
    optimizePackageImports: [
      '@clerk/nextjs',
      'lucide-react',
    ],
    // Allow larger payloads through middleware
    middlewareClientMaxBodySize: 5000000000,
  },



  webpack: (config, { isServer }) => {
    // Exclude unnecessary directories from webpack watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/.git',
        '**/.next',
        '**/dist',
        '**/backups',
        '**/.idea',
        '**/.vscode',
        '**/.devcontainer',
        '**/coverage',
        '**/test-results',
        '**/docker',
        '**/scripts',
        '**/temp',
        '**/postgres-data',
      ],
    };

    // Optimize module resolution
    config.resolve.modules = ['node_modules', 'src'];

    // Ignore server-only modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'cross-spawn': false,
      };
    }

    return config;
  },

  images: {
    unoptimized: true,
    disableStaticImages: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
