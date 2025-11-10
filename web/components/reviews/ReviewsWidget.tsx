'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CreateReviewForm from './CreateReviewForm';
import type { Review, ReviewStats } from '@/types/reviews';
import { formatDate } from '@/lib/utils';

interface ReviewsWidgetProps {
  type: 'product' | 'confectioner' | 'shop' | 'brand';
  productId?: number;
  confectionerId?: string;
  shopId?: number;
  showCreateForm?: boolean;
  limit?: number;
}

export default function ReviewsWidget({
  type,
  productId,
  confectionerId,
  shopId,
  showCreateForm = true,
  limit = 5
}: ReviewsWidgetProps) {
  const supabase = getClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadReviews();
    loadStats();
  }, [type, productId, confectionerId, shopId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadReviews = async () => {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url),
        review_responses(
          id,
          content,
          is_admin_response,
          created_at,
          responder_profile:responder_id(full_name, role)
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    switch (type) {
      case 'product':
        if (productId) query = query.eq('product_id', productId);
        break;
      case 'confectioner':
        if (confectionerId) query = query.eq('confectioner_id', confectionerId);
        break;
      case 'shop':
        if (shopId) query = query.eq('shop_id', shopId);
        break;
      case 'brand':
        query = query.eq('review_type', 'brand');
        break;
    }

    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  };

  const loadStats = async () => {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId.toString());
    if (confectionerId) params.set('confectioner_id', confectionerId);
    if (shopId) params.set('shop_id', shopId.toString());
    if (type !== 'brand') params.set('type', type);

    const response = await fetch(`/api/reviews/stats?${params}`);
    const data = await response.json();
    setStats(data);
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'product': return 'Отзывы о товаре';
      case 'confectioner': return 'Отзывы о кондитере';
      case 'shop': return 'Отзывы о магазине';
      case 'brand': return 'Отзывы о бренде';
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  if (loading) return <div>Загрузка отзывов...</div>;

  return (
    <div>
      {stats && (
        <Card style={{ marginBottom: '16px' }}>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                  {stats.average_rating.toFixed(1)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Средняя оценка</div>
                <div style={{ fontSize: '18px', marginTop: '4px' }}>
                  {renderStars(Math.round(stats.average_rating))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.total_reviews}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Всего отзывов</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                  {stats.verified_reviews}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Подтвержденных</div>
              </div>
            </div>

            {/* Распределение рейтингов */}
            <div style={{ marginTop: '16px' }}>
              <h4>Распределение оценок</h4>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <span style={{ width: '20px' }}>{rating}</span>
                    <div style={{ flex: 1, background: '#f0f0f0', height: '8px', borderRadius: '4px' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: '#4caf50',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <span style={{ width: '30px', fontSize: '12px' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{getTypeTitle()}</h3>
        {showCreateForm && user && (
          <Button onClick={() => setShowForm(true)}>
            Оставить отзыв
          </Button>
        )}
      </div>

      {showForm && (
        <CreateReviewForm
          reviewType={type}
          productId={productId}
          confectionerId={confectionerId}
          shopId={shopId}
          onSuccess={() => {
            setShowForm(false);
            loadReviews();
            loadStats();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="card">
            <p>Отзывов пока нет. Будьте первым!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <CardTitle style={{ fontSize: '16px' }}>
                      {review.profiles?.full_name || 'Анонимный пользователь'}
                    </CardTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{renderStars(review.rating)}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(review.created_at)}
                      </span>
                      {review.verified_purchase && (
                        <span className="badge" style={{ background: '#4caf50' }}>✓</span>
                      )}
                      {review.is_featured && (
                        <span className="badge" style={{ background: '#ff9800' }}>⭐</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ margin: '8px 0' }}>{review.text}</p>

                {/* Фотографии */}
                {review.photos && review.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
                    {review.photos.slice(0, 3).map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Фото ${i + 1}`}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                    {review.photos.length > 3 && (
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        +{review.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Ответы */}
                {review.review_responses && review.review_responses.length > 0 && (
                  <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '2px solid #eee' }}>
                    {review.review_responses.map((response) => (
                      <div key={response.id} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          {response.is_admin_response ? 'Ответ администратора' : response.responder_profile?.full_name}
                          {response.responder_profile?.role && ` (${response.responder_profile.role})`}
                          {' • '}
                          {formatDate(response.created_at)}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px' }}>{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Действия */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      fontSize: '12px',
                      background: 'none',
                      border: '1px solid #ddd',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // В будущем - полезность отзыва
                    }}
                  >
                    👍 Полезно
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {reviews.length >= limit && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button variant="outline">
            Посмотреть все отзывы
          </Button>
        </div>
      )}
    </div>
  );
}
