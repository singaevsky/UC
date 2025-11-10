import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Проверяем права администратора
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { id, status, admin_response, is_featured, admin_notes } = await req.json();

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (admin_response) {
      updates.admin_response = admin_response;
      updates.admin_responded_at = new Date().toISOString();
      updates.admin_responded_by = user.id;
    }

    if (typeof is_featured === 'boolean') {
      updates.is_featured = is_featured;
    }

    if (admin_notes) {
      updates.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
