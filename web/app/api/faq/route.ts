import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    let query = supabase
      .from('faq_items')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (category) query = query.eq('category', category);
    if (active === 'true') query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const { data: { profile } } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const faqData = await req.json();
    faqData.created_by = user.id;

    const { data, error } = await supabase
      .from('faq_items')
      .insert([faqData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const { data: { profile } } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { id, ...updates } = await req.json();

    const { data, error } = await supabase
      .from('faq_items')
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

export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const { data: { profile } } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    }

    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
