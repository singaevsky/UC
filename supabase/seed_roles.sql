-- Создаем пример пользователей для разных ролей
-- Эти ID нужно будет заменить на реальные ID пользователей из auth.users

-- Менеджер магазина
INSERT INTO public.profiles (id, full_name, role, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'Елена Менеджерова', 'manager', '+7 (999) 111-11-11');

-- Кондитер
INSERT INTO public.profiles (id, full_name, role, phone) VALUES
('00000000-0000-0000-0000-000000000002', 'Анна Кондитерова', 'confectioner', '+7 (999) 222-22-22');

-- Управляющий
INSERT INTO public.profiles (id, full_name, role, phone) VALUES
('00000000-0000-0000-0000-000000000003', 'Михаил Управляющий', 'supervisor', '+7 (999) 333-33-33');

-- Пример задач
INSERT INTO public.tasks (title, description, assigned_to, priority, status) VALUES
('Подготовить заказ на свадебный торт', 'Заказ #123 - торт "Невеста" 3 яруса', '00000000-0000-0000-0000-000000000002', 'urgent', 'pending'),
('Связаться с клиентом по заказу #124', 'Уточнить детали доставки', '00000000-0000-0000-0000-000000000001', 'high', 'pending'),
('Проверить складские остатки', 'Инвентаризация на 15.01.2024', '00000000-0000-0000-0000-000000000003', 'medium', 'pending');

-- Пример коммуникаций
INSERT INTO public.client_communications (order_id, client_id, type, direction, content, manager_id, follow_up_required, follow_up_date) VALUES
(1, '00000000-0000-0000-0000-000000000004', 'call', 'outgoing', 'Уточнили время доставки на завтра 14:00', '00000000-0000-0000-0000-000000000001', true, NOW() + INTERVAL '1 day'),
(2, '00000000-0000-0000-0000-000000000005', 'email', 'incoming', 'Клиент просит изменить надпись на торте', '00000000-0000-0000-0000-000000000001', false, null);
