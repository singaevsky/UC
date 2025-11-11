// file: app/api/price/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculatePrice } from '@/shared/lib/price/priceCalculator';

const BodySchema = z.object({
  config: z.record(z.any()),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const price = calculatePrice(parsed.data.config);
  return NextResponse.json({ price });
}
