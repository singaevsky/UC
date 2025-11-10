import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewType = searchParams.get('type');
    const productId = searchParams.get('product_id');
    const confectionerId = searchParams.get('confectioner_id');
    const shopId = searchParams.get('shop_id');

    let baseQuery = supabase
      .from('reviews')
      .select('rating, review_type, status, verified_purchase, is_featured');

    if (reviewType) baseQuery = baseQuery.eq('review_type', reviewType);
    if (productId) baseQuery = baseQuery.eq('product_id', productId);
    if (confectionerId) baseQuery = baseQuery.eq('confectioner_id', confectionerId);
    if (shopId) baseQuery = baseQuery.eq('shop_id', shopId);

    const { data: reviews, error } = await baseQuery;

    if (error) throw error;

    // Подсчитываем статистику
    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews?.filter(r => r.rating === 1).length || 0,
      2: reviews?.filter(r => r.rating === 2).length || 0,
      3: reviews?.filter(r => r.rating === 3).length || 0,
      4: reviews?.filter(r => r.rating === 4).length || 0,
      5: reviews?.filter(r => r.rating === 5).length || 0
    };

    const reviewsByType = {
      product: reviews?.filter(r => r.review_type === 'product').length || 0,
      confectioner: reviews?.filter(r => r.review_type === 'confectioner').length || 0,
      shop: reviews?.filter(r => r.review_type === 'shop').length || 0,
      brand: reviews?.filter(r => r.review_type === 'brand').length || 0
    };

    const stats = {
      total_reviews: totalReviews,
      average_rating: Math.round(averageRating * 10) / 10,
      rating_distribution: ratingDistribution,
      reviews_by_type: reviewsByType,
      verified_reviews: reviews?.filter(r => r.verified_purchase).length || 0,
      featured_reviews: reviews?.filter(r => r.is_featured).length || 0,
      pending_moderation: reviews?.filter(r => r.status === 'pending').length || 0,
      published_reviews: reviews?.filter(r => r.status === 'published').length || 0
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
