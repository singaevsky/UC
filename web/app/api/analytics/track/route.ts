import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const supabase = getServerClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, type, data, timestamp } = await req.json();

    const { error } = await supabase.from('events').insert({
      user_id: userId || null,
      type,
      payload: { ...data, timestamp },
      created_at: timestamp ? new Date(timestamp) : new Date()
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
