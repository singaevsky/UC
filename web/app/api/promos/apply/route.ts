import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const { data: promo } = await supabase.from('promotions').select('*').eq('promo_code', code).eq('active', true).single();
  if (!promo) return NextResponse.json({ error: 'Неверный промокод' }, { status: 400 });
  return NextResponse.json({ discount_percent: promo.discount_percent, discount_amount: promo.discount_amount });
}
