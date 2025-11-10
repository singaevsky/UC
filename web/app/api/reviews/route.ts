import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewType = searchParams.get('type');
    const status = searchParams.get('status');
    const productId = searchParams.get('product_id');
    const confectionerId = searchParams.get('confectioner_id');
    const shopId = searchParams.get('shop_id');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('reviews').select(`
      *,
      profiles:user_id(full_name, avatar_url),
      products:product_id(name, images),
      confectioner_profiles:confectioner_id(full_name, specialty),
      order_items:order_id(name_snapshot),
      review_responses(
        id,
        content,
        is_admin_response,
        created_at,
        responder_profile:responder_id(full_name, role)
      )
    `);

    if (reviewType) query = query.eq('review_type', reviewType);
    if (status) query = query.eq('status', status);
    if (productId) query = query.eq('product_id', productId);
    if (confectionerId) query = query.eq('confectioner_id', confectionerId);
    if (shopId) query = query.eq('shop_id', shopId);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (status === 'published') query = query.eq('status', 'published');

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      reviews: data,
      total: count,
      hasMore: (offset + limit) < (count || 0)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const reviewData = JSON.parse(formData.get('data') as string);
    const photos = formData.getAll('photos') as File[];

    // Загружаем фотографии
    const photoUrls: string[] = [];
    for (const photo of photos) {
      if (photo.size > 0) {
        const fileName = `reviews/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reviews')
          .getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const review = {
      ...reviewData,
      user_id: user.id,
      photos: photoUrls,
      verified_purchase: !!reviewData.order_id
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
