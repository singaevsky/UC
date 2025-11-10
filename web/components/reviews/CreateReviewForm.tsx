'use client';

import { useState, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CreateReviewData } from '@/types/reviews';

interface CreateReviewFormProps {
  reviewType: 'product' | 'confectioner' | 'shop' | 'brand';
  productId?: number;
  confectionerId?: string;
  shopId?: number;
  orderId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateReviewForm({
  reviewType,
  productId,
  confectionerId,
  shopId,
  orderId,
  onSuccess,
  onCancel
}: CreateReviewFormProps) {
  const supabase = getClient();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert('Максимум 5 фотографий');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      alert('Пожалуйста, напишите отзыв');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const reviewData: CreateReviewData = {
        review_type: reviewType,
        rating,
        text: text.trim(),
        product_id: productId,
        confectioner_id: confectionerId,
        shop_id: shopId,
        order_id: orderId
      };

      formData.append('data', JSON.stringify(reviewData));
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания отзыва');
      }

      alert('Спасибо за ваш отзыв! Он будет опубликован после модерации.');
      onSuccess?.();

    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Оставить отзыв</h3>

      <div style={{ margin: '16px 0' }}>
        <label>Оценка:</label>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                fontSize: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: star <= rating ? '#ffd700' : '#ddd'
              }}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div style={{ margin: '16px 0' }}>
        <label>Ваш отзыв:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          rows={4}
          placeholder="Расскажите о вашем опыте..."
          style={{ width: '100%', marginTop: '4px' }}
          maxLength={1000}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {text.length}/1000 символов
        </p>
      </div>

      <div style={{ margin: '16px 0' }}>
        <label>Фотографии (до 5):</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ marginTop: '4px' }}
        />

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {photos.map((photo, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Фото ${index + 1}`}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'end' }}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Отправляем...' : 'Отправить отзыв'}
        </Button>
      </div>
    </form>
  );
}
