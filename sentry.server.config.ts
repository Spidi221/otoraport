import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Context enrichment
  beforeSend(event, hint) {
    // Add custom context for better debugging
    if (event.request) {
      event.tags = {
        ...event.tags,
        method: event.request.method,
      };
    }
    return event;
  },

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',
});
