// file: next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // тЬЕ ╨С╨░╨╖╨╛╨▓╤Л╨╡ ╨╜╨░╤Б╤В╤А╨╛╨╣╨║╨╕
  reactStrictMode: true,
  swcMinify: true,

  // тЬЕ ╨н╨║╤Б╨┐╨╡╤А╨╕╨╝╨╡╨╜╤В╨░╨╗╤М╨╜╤Л╨╡ ╤Д╤Г╨╜╨║╤Ж╨╕╨╕
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ ╨╕╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╨╣
  images: {
    domains: [
      'localhost',
      'uc-storage.supabase.co',
      'images.unsplash.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // тЬЕ ╨Ъ╨╛╨╝╨┐╤А╨╡╤Б╤Б╨╕╤П
  compress: true,

  // тЬЕ Headers ╨┤╨╗╤П ╨▒╨╡╨╖╨╛╨┐╨░╤Б╨╜╨╛╤Б╤В╨╕ ╨╕ ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨┤╨╕╤В╨╡╨╗╤М╨╜╨╛╤Б╤В╨╕
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // тЬЕ Security Headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // тЬЕ Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.sentry.io *.logrocket.io",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: *.unsplash.com *.supabase.co",
              "connect-src 'self' *.supabase.co *.sentry.io *.logrocket.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },

          // тЬЕ Performance Headers
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // тЬЕ CORS Headers ╨┤╨╗╤П API
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://uc-constructor.vercel.app'
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },

      // тЬЕ ╨Ъ╨╡╤И╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╤Б╤В╨░╤В╨╕╤З╨╡╤Б╨║╨╕╤Е ╤Д╨░╨╣╨╗╨╛╨▓
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // тЬЕ ╨Ъ╨╡╤И╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╨╕╨╖╨╛╨▒╤А╨░╨╢╨╡╨╜╨╕╨╣
      {
        source: '/(.*)\\.(svg|png|jpg|jpeg|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // тЬЕ Redirects
  async redirects() {
    return [
      {
        source: '/constructor',
        destination: '/constructor',
        permanent: true,
      },
      {
        source: '/cake/:id',
        destination: '/preview/:id',
        permanent: true,
      },
    ];
  },

  // тЬЕ Rewrites
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // тЬЕ Environment Variables ╨┤╨╗╤П ╨║╨╗╨╕╨╡╨╜╤В╨░
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ Webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // тЬЕ ╨Ю╨┐╤В╨╕╨╝╨╕╨╖╨░╤Ж╨╕╤П ╨┤╨╗╤П production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,

        // ╨Ю╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ ╤З╨░╨╜╨║ ╨┤╨╗╤П vendor ╨▒╨╕╨▒╨╗╨╕╨╛╤В╨╡╨║
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },

        // ╨Ю╤В╨┤╨╡╨╗╤М╨╜╤Л╨╣ ╤З╨░╨╜╨║ ╨┤╨╗╤П UI ╨║╨╛╨╝╨┐╨╛╨╜╨╡╨╜╤В╨╛╨▓
        ui: {
          test: /[\\/]components[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 20,
        },
      };
    }

    // тЬЕ ╨Ш╤Б╨║╨╗╤О╤З╨░╨╡╨╝ ╨▒╨╛╨╗╤М╤И╨╕╨╡ ╤Д╨░╨╣╨╗╤Л ╨╕╨╖ ╨▒╨░╨╜╨┤╨╗╨░
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
        },
      },
    });

    return config;
  },

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'utils'],
  },

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ Bundle Analyzer (╤В╨╛╨╗╤М╨║╨╛ ╨▓ dev)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

// тЬЕ ╨Ъ╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╤П Sentry
const sentryWebpackPluginOptions = {
  // тЬЕ ╨Ю╤Б╨╜╨╛╨▓╨╜╤Л╨╡ ╨╜╨░╤Б╤В╤А╨╛╨╣╨║╨╕
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // тЬЕ ╨Э╨░╤Б╤В╤А╨╛╨╣╨║╨╕ ╨╖╨░╨│╤А╤Г╨╖╨║╨╕ source maps
  widenClientFileUpload: true,
  hideSourceMaps: false,

  // тЬЕ ╨Т╨║╨╗╤О╤З╨░╨╡╨╝ ╨░╨▓╤В╨╛╨╝╨░╤В╨╕╤З╨╡╤Б╨║╤Г╤О ╨│╨╡╨╜╨╡╤А╨░╤Ж╨╕╤О release
  automaticVercelMonitors: true,

  // тЬЕ ╨Ш╤Б╨║╨╗╤О╤З╨░╨╡╨╝ ╨╛╨┐╤А╨╡╨┤╨╡╨╗╨╡╨╜╨╜╤Л╨╡ ╤Д╨░╨╣╨╗╤Л ╨╕╨╖ source maps
  exclude: [
    /node_modules/,
    /\.(test|spec)\.(js|ts|tsx)$/,
    /__tests__/,
  ],

  // тЬЕ ╨Ф╨╛╨┐╨╛╨╗╨╜╨╕╤В╨╡╨╗╤М╨╜╤Л╨╡ ╨╜╨░╤Б╤В╤А╨╛╨╣╨║╨╕ ╨┤╨╗╤П production
  ...(process.env.NODE_ENV === 'production' && {
    publishRelease: true,
    telemetry: false,
  }),
};

// тЬЕ ╨Ю╨▒╤К╨╡╨┤╨╕╨╜╤П╨╡╨╝ ╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕
const configWithSentry = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

// тЬЕ ╨н╨║╤Б╨┐╨╛╤А╤В ╤Д╨╕╨╜╨░╨╗╤М╨╜╨╛╨╣ ╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕
module.exports = configWithSentry;

