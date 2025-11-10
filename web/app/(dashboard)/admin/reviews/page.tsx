'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Review, ReviewModerationData } from '@/types/reviews';

export default function ReviewsModeration() {
  const supabase = getClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationData, setModerationData] = useState<ReviewModerationData>({});

  useEffect(() => {
    loadReviews();
  }, [selectedStatus]);

  const loadReviews = async () => {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id(full_name),
        products:product_id(name),
        confectioner_profiles:confectioner_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  };

  const handleModerate = (review: Review) => {
    setSelectedReview(review);
    setModerationData({
      status: review.status,
      admin_response: review.admin_response || '',
      is_featured: review.is_featured
    });
    setShowModerationModal(true);
  };

  const submitModeration = async () => {
    if (!selectedReview) return;

    try {
      const { error } = await supabase
        .rpc('moderate_review', {
          review_id_param: selectedReview.id,
          status_param: moderationData.status,
          admin_response_param: moderationData.admin_response,
          is_featured_param: moderationData.is_featured,
          admin_id_param: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      alert('Отзыв модерации успешно обновлен');
      setShowModerationModal(false);
      setSelectedReview(null);
      loadReviews();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (searchQuery) {
      return review.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             review.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'published': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'under_review': return '#2196f3';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return '🍰';
      case 'confectioner': return '👨‍🍳';
      case 'shop': return '🏪';
      case 'brand': return '🏷️';
      default: return '📝';
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="mb-4">
        <h1>Модерация отзывов</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
          <div>
            <label>Статус:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
              style={{ width: 'auto', marginLeft: '8px' }}
            >
              <option value="all">Все</option>
              <option value="pending">Ожидают модерации</option>
              <option value="under_review">На рассмотрении</option>
              <option value="published">Опубликованы</option>
              <option value="rejected">Отклонены</option>
            </select>
          </div>
          <div>
            <label>Поиск:</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту или имени..."
              style={{ width: '300px', marginLeft: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Список отзывов */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} hover>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{getTypeIcon(review.review_type)}</span>
                      {review.review_type === 'product' && review.products?.name}
                      {review.review_type === 'confectioner' && review.confectioner_profiles?.full_name}
                      {review.review_type === 'shop' && 'Магазин'}
                      {review.review_type === 'brand' && 'Бренд'}
                    </CardTitle>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                      {review.profiles?.full_name} • {formatDateTime(review.created_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {'⭐'.repeat(review.rating)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: getStatusColor(review.status),
                      fontWeight: 'bold'
                    }}>
                      {review.status}
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
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ))}
                    {review.photos.length > 3 && (
                      <div style={{
                        width: '60px',
                        height: '60px',
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

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {review.verified_purchase && (
                    <span className="badge" style={{ background: '#4caf50' }}>
                      ✓ Подтвержденная покупка
                    </span>
                  )}
                  {review.is_featured && (
                    <span className="badge" style={{ background: '#ff9800' }}>
                      ⭐ Рекомендуемый
                    </span>
                  )}
                  {review.reported_count > 0 && (
                    <span className="badge" style={{ background: '#f44336' }}>
                      ⚠️ Жалобы: {review.reported_count}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <Button onClick={() => handleModerate(review)} size="sm">
                    Модерировать
                  </Button>
                  {review.review_responses && review.review_responses.length > 0 && (
                    <Button variant="outline" size="sm">
                      Ответы ({review.review_responses.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Статистика */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика модерации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Всего отзывов:</span>
                  <span style={{ fontWeight: 'bold' }}>{reviews.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ожидают модерации:</span>
                  <span style={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {reviews.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Опубликовано:</span>
                  <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {reviews.filter(r => r.status === 'published').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Отклонено:</span>
                  <span style={{ fontWeight: 'bold', color: '#f44336' }}>
                    {reviews.filter(r => r.status === 'rejected').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Рекомендуемые:</span>
                  <span style={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {reviews.filter(r => r.is_featured).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  style={{ width: '100%' }}
                  onClick={async () => {
                    // Массовая публикация верифицированных отзывов
                    const { error } = await supabase
                      .from('reviews')
                      .update({ status: 'published' })
                      .eq('verified_purchase', true)
                      .eq('status', 'pending');

                    if (!error) {
                      alert('Верифицированные отзывы опубликованы');
                      loadReviews();
                    }
                  }}
                >
                  Опубликовать верифицированные
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    // Экспорт отзывов
                    const csv = reviews.map(r =>
                      `${r.id},${r.rating},"${r.text || ''}",${r.review_type},${r.status},${formatDate(r.created_at)}`
                    ).join('\n');

                    const blob = new Blob([`ID,Рейтинг,Текст,Тип,Статус,Дата\n${csv}`], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'reviews.csv';
                    a.click();
                  }}
                >
                  Экспорт в CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модальное окно модерации */}
      {showModerationModal && selectedReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3>Модерация отзыва #{selectedReview.id}</h3>

            <div style={{ margin: '16px 0' }}>
              <div><strong>Автор:</strong> {selectedReview.profiles?.full_name}</div>
              <div><strong>Рейтинг:</strong> {'⭐'.repeat(selectedReview.rating)}</div>
              <div><strong>Тип:</strong> {selectedReview.review_type}</div>
              <div><strong>Дата:</strong> {formatDateTime(selectedReview.created_at)}</div>
            </div>

            <div style={{ margin: '16px 0' }}>
              <strong>Текст отзыва:</strong>
              <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', marginTop: '4px' }}>
                {selectedReview.text}
              </p>
            </div>

            <div style={{ margin: '16px 0' }}>
              <label>Статус:</label>
              <select
                value={moderationData.status}
                onChange={(e) => setModerationData({ ...moderationData, status: e.target.value as any })}
                className="input"
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="pending">Ожидает</option>
                <option value="under_review">На рассмотрении</option>
                <option value="published">Опубликовать</option>
                <option value="rejected">Отклонить</option>
              </select>
            </div>

            <div style={{ margin: '16px 0' }}>
              <label>Ответ администратора:</label>
              <textarea
                value={moderationData.admin_response || ''}
                onChange={(e) => setModerationData({ ...moderationData, admin_response: e.target.value })}
                className="input"
                rows={3}
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="Ответ на отзыв (опционально)..."
              />
            </div>

            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={moderationData.is_featured || false}
                  onChange={(e) => setModerationData({ ...moderationData, is_featured: e.target.checked })}
                />
                Рекомендуемый отзыв
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'end' }}>
              <Button variant="outline" onClick={() => setShowModerationModal(false)}>
                Отмена
              </Button>
              <Button onClick={submitModeration}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
