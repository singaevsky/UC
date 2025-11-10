-- Добавляем примеры отзывов разных типов
-- Отзывы о товарах
INSERT INTO public.reviews (product_id, user_id, review_type, rating, text, status, verified_purchase, photos) VALUES
(1, '00000000-0000-0000-0000-000000000004', 'product', 5, 'Потрясающий торт! Очень вкусно и красиво оформлен. Обязательно закажем еще!', 'published', true, ARRAY['/images/review1_1.jpg', '/images/review1_2.jpg']),
(2, '00000000-0000-0000-0000-000000000005', 'product', 4, 'Хороший торт, но хотелось бы больше начинки. В целом довольны.', 'published', true, ARRAY['/images/review2_1.jpg']),
(1, '00000000-0000-0000-0000-000000000006', 'product', 3, 'Средний вкус, ожидал большего. Возможно, не мой вариант.', 'under_review', false, ARRAY[]);

-- Отзывы о кондитерах
INSERT INTO public.reviews (confectioner_id, user_id, review_type, rating, text, status, order_id, verified_purchase) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'confectioner', 5, 'Анна - волшебница! Сделала торт точно как я хотела, учла все пожелания. Рекомендую!', 'published', 1, true),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', 'confectioner', 4, 'Хорошая работа, быстро и качественно. Буду заказывать еще.', 'published', 2, true);

-- Отзывы о магазине
INSERT INTO public.reviews (shop_id, user_id, review_type, rating, text, status, verified_purchase) VALUES
(1, '00000000-0000-0000-0000-000000000009', 'shop', 5, 'Отличный магазин! Вежливый персонал, быстрое обслуживание, красивая упаковка.', 'published', true),
(1, '00000000-0000-0000-0000-000000000010', 'shop', 2, 'Не понравилось обслуживание, долго ждал. Торт был вкусный, но сервис подкачал.', 'published', true);

-- Отзывы о бренде
INSERT INTO public.reviews (user_id, review_type, rating, text, status, is_featured, verified_purchase) VALUES
('00000000-0000-0000-0000-000000000011', 'brand', 5, 'Лучшая кондитерская в городе! Качество всегда на высоте, а торты - просто произведения искусства. Спасибо за вашу работу!', 'published', true, true),
('00000000-0000-0000-0000-000000000012', 'brand', 4, 'Хорошая кондитерская, стабильное качество. Есть небольшие минусы, но в целом все отлично.', 'published', false, true);

-- Примеры ответов на отзывы
INSERT INTO public.review_responses (review_id, responder_id, content, is_admin_response) VALUES
(1, '00000000-0000-0000-0000-000000000002', 'Спасибо большое за отзыв! Очень рада, что вам понравился торт. Ждем вас снова!', false),
(1, '00000000-0000-0000-0000-000000000013', 'Спасибо за высокую оценку нашей работы! Мы стараемся для наших клиентов.', true);

-- Примеры жалоб
INSERT INTO public.review_reports (review_id, reporter_id, reason, description, status) VALUES
(3, '00000000-0000-0000-0000-000000000014', 'Спам', 'Подозрительно много негативных отзывов от этого пользователя', 'pending', null);
