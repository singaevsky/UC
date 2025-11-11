// file: next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Базовые настройки
  reactStrictMode: true,
  swcMinify: true,

  // ✅ Экспериментальные функции
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },

  // ✅ Настройки изображений
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

  // ✅ Компрессия
  compress: true,

  // ✅ Headers для безопасности и производительности
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ✅ Security Headers
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

          // ✅ Content Security Policy
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

          // ✅ Performance Headers
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

      // ✅ CORS Headers для API
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

      // ✅ Кеширование статических файлов
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ✅ Кеширование изображений
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

  // ✅ Redirects
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

  // ✅ Rewrites
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // ✅ Environment Variables для клиента
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // ✅ Настройки Webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // ✅ Оптимизация для production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,

        // Отдельный чанк для vendor библиотек
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },

        // Отдельный чанк для UI компонентов
        ui: {
          test: /[\\/]components[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 20,
        },
      };
    }

    // ✅ Исключаем большие файлы из бандла
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

  // ✅ Настройки TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ✅ Настройки ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'utils'],
  },

  // ✅ Настройки Bundle Analyzer (только в dev)
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

// ✅ Конфигурация Sentry
const sentryWebpackPluginOptions = {
  // ✅ Основные настройки
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // ✅ Настройки загрузки source maps
  widenClientFileUpload: true,
  hideSourceMaps: false,

  // ✅ Включаем автоматическую генерацию release
  automaticVercelMonitors: true,

  // ✅ Исключаем определенные файлы из source maps
  exclude: [
    /node_modules/,
    /\.(test|spec)\.(js|ts|tsx)$/,
    /__tests__/,
  ],

  // ✅ Дополнительные настройки для production
  ...(process.env.NODE_ENV === 'production' && {
    publishRelease: true,
    telemetry: false,
  }),
};

// ✅ Объединяем конфигурации
const configWithSentry = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

// ✅ Экспорт финальной конфигурации
module.exports = configWithSentry;
