-- Добавляем новые типы отзывов
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_status_check
CHECK (status in ('pending','published','rejected','under_review'));

-- Добавляем новые поля для расширенной привязки
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS review_type text not null default 'product'
CHECK (review_type in ('product','confectioner','shop','brand')),

ADD COLUMN IF NOT EXISTS confectioner_id uuid references public.profiles(id) on delete set null,
ADD COLUMN IF NOT EXISTS shop_id bigint references public.products(category_id) on delete set null,
ADD COLUMN IF NOT EXISTS brand_review boolean not null default false,

ADD COLUMN IF NOT EXISTS admin_response text,
ADD COLUMN IF NOT EXISTS admin_responded_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_responded_by uuid references public.profiles(id) on delete set null,

ADD COLUMN IF NOT EXISTS is_featured boolean not null default false,
ADD COLUMN IF NOT EXISTS helpful_votes int not null default 0,
ADD COLUMN IF NOT EXISTS reported_count int not null default 0,

ADD COLUMN IF NOT EXISTS order_id bigint references public.orders(id) on delete set null,
ADD COLUMN IF NOT EXISTS photos text[] not null default '{}',
ADD COLUMN IF NOT EXISTS verified_purchase boolean not null default false;

-- Создаем таблицу для жалоб на отзывы
CREATE TABLE IF NOT EXISTS public.review_reports (
  id bigserial primary key,
  review_id bigint references public.reviews(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','reviewed','resolved','dismissed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

-- Создаем таблицу для ответов кондитеров
CREATE TABLE IF NOT EXISTS public.review_responses (
  id bigserial primary key,
  review_id bigint references public.reviews(id) on delete cascade,
  responder_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_admin_response boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_confectioner ON public.reviews(confectioner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews(order_id);

CREATE INDEX IF NOT EXISTS idx_review_reports_review ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON public.review_responses(review_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp_responses()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS set_timestamp_review_responses ON public.review_responses;
CREATE TRIGGER set_timestamp_review_responses
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp_responses();

-- Функция для проверки прав доступа к отзыву
CREATE OR REPLACE FUNCTION public.can_manage_review(review_id_param bigint, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  review_record public.reviews;
  user_profile public.profiles;
BEGIN
  -- Получаем данные отзыва
  SELECT * INTO review_record FROM public.reviews WHERE id = review_id_param;

  -- Получаем профиль пользователя
  SELECT * INTO user_profile FROM public.profiles WHERE id = user_id_param;

  -- Проверяем права
  IF user_profile.role IN ('supervisor', 'admin') THEN
    RETURN true;
  END IF;

  -- Владелец отзыва может управлять своим отзывом
  IF review_record.user_id = user_id_param THEN
    RETURN true;
  END IF;

  -- Кондитер может отвечать на отзывы о себе
  IF review_record.confectioner_id = user_id_param AND user_profile.role = 'confectioner' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для автоматической публикации верифицированных отзывов
CREATE OR REPLACE FUNCTION public.auto_publish_verified_reviews()
RETURNS trigger AS $$
BEGIN
  -- Если отзыв помечен как подтвержденная покупка и нет причин для отклонения, публикуем автоматически
  IF NEW.verified_purchase = true AND NEW.status = 'pending' THEN
    NEW.status = 'published';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_publish_verified_reviews ON public.reviews;
CREATE TRIGGER auto_publish_verified_reviews
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_publish_verified_reviews();

-- RLS для новых таблиц
ALTER TABLE public.review_reports enable row level security;
ALTER TABLE public.review_responses enable row level security;

-- Обновляем RLS для reviews
DROP POLICY IF EXISTS "Public read reviews published" ON public.reviews;
DROP POLICY IF EXISTS "Users insert their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;

-- Новые политики для reviews
-- Публичное чтение опубликованных отзывов
CREATE POLICY "Public read published reviews" ON public.reviews
FOR SELECT USING (status = 'published');

-- Пользователи могут видеть свои отзывы
CREATE POLICY "Users read own reviews" ON public.reviews
FOR SELECT USING (auth.uid() = user_id);

-- Создание отзывов
CREATE POLICY "Users create reviews" ON public.reviews
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  (review_type = 'product' OR auth.uid() IS NOT NULL)
);

-- Обновление собственных отзывов (только до модерации)
CREATE POLICY "Users update own reviews" ON public.reviews
FOR UPDATE USING (
  auth.uid() = user_id AND status IN ('pending', 'under_review')
);

-- Администраторы могут всё
CREATE POLICY "Admins manage all reviews" ON public.reviews
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- Кондитер может отвечать на отзывы о себе
CREATE POLICY "Confectioners respond to own reviews" ON public.reviews
FOR UPDATE USING (
  confectioner_id = auth.uid() and
  exists (select 1 from public.profiles where id = auth.uid() and role = 'confectioner')
);

-- RLS для review_reports
CREATE POLICY "Users create review reports" ON public.review_reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users read own review reports" ON public.review_reports
FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins manage review reports" ON public.review_reports
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- RLS для review_responses
CREATE POLICY "Public read review responses" ON public.review_responses
FOR SELECT USING (true);

CREATE POLICY "Users create responses" ON public.review_responses
FOR INSERT WITH CHECK (
  auth.uid() = responder_id AND
  can_manage_review(review_id, auth.uid()) = true
);

CREATE POLICY "Users update own responses" ON public.review_responses
FOR UPDATE USING (auth.uid() = responder_id);

CREATE POLICY "Admins manage all responses" ON public.review_responses
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);
