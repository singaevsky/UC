// file: app/api/price/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';

const PriceRequestSchema = z.object({
  config: z.record(z.any()),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PriceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid config',
      issues: parsed.error.issues,
    }, { status: 400 });
  }

  try {
    const price = calculatePrice(parsed.data.config);
    return NextResponse.json({ price });
  } catch (e) {
    return NextResponse.json({
      error: 'Calculation failed',
      details: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 500 });
  }
}
