-- Добавляем новые поля в posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS author_id uuid references public.profiles(id) on delete set null,
ADD COLUMN IF NOT EXISTS category_id bigint,
ADD COLUMN IF NOT EXISTS tags text[] not null default '{}',
ADD COLUMN IF NOT EXISTS featured boolean not null default false,
ADD COLUMN IF NOT EXISTS views_count int not null default 0,
ADD COLUMN IF NOT EXISTS likes_count int not null default 0,
ADD COLUMN IF NOT EXISTS reading_time int,
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS cover_alt text,
ADD COLUMN IF NOT EXISTS updated_by uuid references public.profiles(id) on delete set null;

-- Создаем таблицу категорий блога
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  description text,
  color text default '#7b5a3c',
  created_at timestamptz not null default now()
);

-- Создаем таблицу комментариев к постам
CREATE TABLE IF NOT EXISTS public.post_comments (
  id bigserial primary key,
  post_id bigint references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  parent_id bigint references public.post_comments(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Создаем таблицу для FAQ
CREATE TABLE IF NOT EXISTS public.faq_items (
  id bigserial primary key,
  category text not null default 'general',
  question text not null,
  answer text not null,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Создаем таблицу для медиа файлов блога
CREATE TABLE IF NOT EXISTS public.blog_media (
  id bigserial primary key,
  post_id bigint references public.posts(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size int,
  alt_text text,
  created_at timestamptz not null default now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON public.posts(featured);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_status ON public.post_comments(status);
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_active ON public.faq_items(is_active);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp_blog()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS set_timestamp_post_comments ON public.post_comments;
CREATE TRIGGER set_timestamp_post_comments
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp_blog();

DROP TRIGGER IF EXISTS set_timestamp_faq_items ON public.faq_items;
CREATE TRIGGER set_timestamp_faq_items
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp_blog();

-- Функция для подсчета времени чтения
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content_text text)
RETURNS int AS $$
DECLARE
  word_count int;
BEGIN
  word_count := array_length(string_to_array(trim(content_text), ' '), 1);
  RETURN greatest(1, ceil(word_count / 200.0)::int); -- 200 слов в минуту
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического расчета времени чтения
CREATE OR REPLACE FUNCTION public.auto_calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time := calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_reading_time_posts ON public.posts;
CREATE TRIGGER auto_reading_time_posts
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_reading_time();

-- RLS для новых таблиц
ALTER TABLE public.blog_categories enable row level security;
ALTER TABLE public.post_comments enable row level security;
ALTER TABLE public.faq_items enable row level security;
ALTER TABLE public.blog_media enable row level security;

-- Обновляем RLS для posts
DROP POLICY IF EXISTS "Public read posts published" ON public.posts;
DROP POLICY IF EXISTS "Public read pages" ON public.pages;

-- Новые политики для posts
-- Публичное чтение опубликованных постов
CREATE POLICY "Public read published posts" ON public.posts
FOR SELECT USING (status = 'published');

-- Авторы могут управлять своими постами
CREATE POLICY "Authors manage own posts" ON public.posts
FOR ALL USING (
  auth.uid() = author_id AND
  exists (select 1 from public.profiles where id = auth.uid() and role in ('confectioner','manager','supervisor','admin'))
);

-- Администраторы могут всё
CREATE POLICY "Admins manage all posts" ON public.posts
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- Создание постов
CREATE POLICY "Authenticated users can create posts" ON public.posts
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  exists (select 1 from public.profiles where id = auth.uid() and role in ('confectioner','manager','supervisor','admin'))
);

-- RLS для blog_categories
CREATE POLICY "Public read blog categories" ON public.blog_categories for select using (true);
CREATE POLICY "Admins manage blog categories" ON public.blog_categories
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- RLS для post_comments
CREATE POLICY "Public read published comments" ON public.post_comments
FOR SELECT USING (status = 'published');

CREATE POLICY "Users create comments" ON public.post_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.uid() IS NOT NULL
);

CREATE POLICY "Users update own comments" ON public.post_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all comments" ON public.post_comments
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- RLS для faq_items
CREATE POLICY "Public read active faq" ON public.faq_items
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage faq" ON public.faq_items
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- RLS для blog_media
CREATE POLICY "Public read blog media" ON public.blog_media for select using (true);
CREATE POLICY "Authors manage own media" ON public.blog_media
FOR ALL USING (
  exists (
    select 1 from public.posts p
    join public.profiles pr on p.author_id = pr.id
    where p.id = blog_media.post_id
    and pr.id = auth.uid()
    and pr.role in ('confectioner','manager','supervisor','admin')
  )
);
CREATE POLICY "Admins manage all media" ON public.blog_media
FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);
