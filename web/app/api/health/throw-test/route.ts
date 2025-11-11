// file: app/api/health/throw-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
// file: app/api/health/throw-test/route.ts



// импорт Sentry не обязателен – в Next 13+ он уже глобально инициализирован
// import * as Sentry from '@sentry/nextjs';

export async function GET(_req: NextRequest) {
  // Принудительно бросаем ошибку, которую Sentry зафиксирует
  throw new Error('Test error from /api/health/throw-test – all good!');
}
