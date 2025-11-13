// Minimal placeholder for Sentry server configuration used during build.
// Replace with your real Sentry dsn and settings if you use Sentry in production.
import { init } from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  });
}

export {};
