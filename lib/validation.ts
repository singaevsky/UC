import { z } from 'zod';

// Валидация создания товара
export const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Неверный формат slug'),
  category_id: z.number().min(1, 'Выберите категорию'),
  description: z.string().optional(),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  base_weight: z.number().min(0.1).max(50).optional(),
  event_types: z.array(z.string()),
  filling_ids: z.array(z.number()),
  images: z.array(z.string()).min(1, 'Добавьте хотя бы одно изображение'),
  active: z.boolean()
});

// Валидация заказа
export const orderSchema = z.object({
  delivery_method: z.enum(['pickup', 'courier', 'sdek']),
  delivery_price: z.number().min(0),
  address: z.object({
    city: z.string().min(1),
    street: z.string().min(1),
    house: z.string().min(1),
    flat: z.string().optional()
  }).optional(),
  payment_method: z.enum(['card', 'sberbank', 'tinkoff', 'yookassa']),
  comments: z.string().optional(),
  promo_code: z.string().optional()
});

// Валидация отзыва
export const reviewSchema = z.object({
  product_id: z.number().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(10, 'Отзыв слишком короткий').max(500),
  image_url: z.string().optional()
});

export type ProductInput = z.infer<typeof productSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
