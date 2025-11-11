// file: lib/analytics/monitor.ts
import * as Sentry from '@sentry/nextjs';
import LogRocket from 'logrocket';

type ActionMetric = {
  name: string;
  start: number;
  end?: number;
};

export function trackAction(name: string) {
  const metric: ActionMetric = { name, start: performance.now() };
  // Завершение метрики
  return () => {
    metric.end = performance.now();
    const duration = metric.end - metric.start;
    Sentry.addBreadcrumb({
      message: `Action ${name} took ${duration.toFixed(2)}ms`,
      category: 'performance',
      level: 'info',
    });
    LogRocket.track(name, { duration });
  };
}
