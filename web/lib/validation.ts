import { z } from 'zod';

// Валидация создания товара
export const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Название слишком длинное'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Неверный формат slug'),
  category_id: z.number().min(1, 'Выберите категорию'),
  description: z.string().optional(),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  base_weight: z.number().min(0.1, 'Вес должен быть больше 0').max(50, 'Вес не может быть больше 50').optional(),
  event_types: z.array(z.string()).min(1, 'Выберите хотя бы одно событие'),
  filling_ids: z.array(z.number()).min(1, 'Выберите хотя бы одну начинку'),
  images: z.array(z.string()).min(1, 'Добавьте хотя бы одно изображение'),
  active: z.boolean()
});

// Валидация заказа
export const orderSchema = z.object({
  delivery_method: z.enum(['pickup', 'courier', 'sdek']),
  delivery_price: z.number().min(0),
  address: z.object({
    city: z.string().min(1, 'Город обязателен'),
    street: z.string().min(1, 'Улица обязательна'),
    house: z.string().min(1, 'Дом обязателен'),
    flat: z.string().optional()
  }).optional(),
  payment_method: z.enum(['card', 'sberbank', 'tinkoff', 'yookassa']),
  comments: z.string().max(500, 'Комментарий не может быть длиннее 500 символов').optional(),
  promo_code: z.string().optional()
});

// Валидация отзыва
export const reviewSchema = z.object({
  product_id: z.number().min(1, 'Некорректный ID товара'),
  rating: z.number().min(1, 'Рейтинг должен быть от 1 до 5').max(5, 'Рейтинг должен быть от 1 до 5'),
  text: z.string().min(10, 'Отзыв слишком короткий').max(500, 'Отзыв слишком длинный'),
  image_url: z.string().url('Некорректный URL изображения').optional()
});

// Валидация профиля пользователя
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
  phone: z.string().optional()
});

// Валидация конструктора торта
export const cakeConstructorSchema = z.object({
  event: z.enum(['wedding', 'birthday', 'corporate', 'anniversary', 'kids', 'other']),
  cakeType: z.enum(['tort', 'dessert', 'keks']),
  form: z.enum(['round', 'square', 'heart', 'rectangle']),
  layers: z.number().min(1, 'Минимум 1 ярус').max(4, 'Максимум 4 яруса'),
  weight: z.number().min(0.5, 'Минимальный вес 0.5 кг').max(10, 'Максимальный вес 10 кг'),
  fillings: z.array(z.string()).max(3, 'Максимум 3 начинки'),
  topping: z.enum(['fondant', 'cream', 'chocolate', 'buttercream']),
  colors: z.array(z.string()).max(2, 'Максимум 2 цвета'),
  date: z.string().optional(),
  name: z.string().max(50, 'Надпись не может быть длиннее 50 символов').optional(),
  comments: z.string().max(200, 'Комментарий не может быть длиннее 200 символов').optional()
});

export type ProductInput = z.infer<typeof productSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CakeConstructorInput = z.infer<typeof cakeConstructorSchema>;
