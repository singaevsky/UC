import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const supabase = getServerClient();

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const { data: promo } = await supabase.from('promotions').select('*').eq('promo_code', code).eq('active', true).single();
  if (!promo) return NextResponse.json({ error: 'Неверный промокод' }, { status: 400 });
  return NextResponse.json({ discount_percent: promo.discount_percent, discount_amount: promo.discount_amount });
}
