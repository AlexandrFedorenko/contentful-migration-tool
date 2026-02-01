import "dotenv/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
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
        '**/electron',
        '**/backups',
        '**/.idea',
        '**/.vscode',
        '**/.devcontainer',
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
    domains: ['localhost', 'images.ctfassets.net'],
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
