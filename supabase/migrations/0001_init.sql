-- Включаем нужные расширения
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ENUMs
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type event_type as enum ('wedding','birthday','corporate','anniversary','kids','other');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('created','paid','preparing','ready','delivered','cancelled','refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_method') then
    create type delivery_method as enum ('pickup','courier','sdek');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('card','sberbank','tinkoff','yookassa');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending','paid','failed','refunded');
  end if;
end$$;

-- Профили пользователей
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  bonus_balance int not null default 0,
  role text not null default 'user' check (role in ('user','manager','admin')),
  created_at timestamptz not null default now()
);

-- Каталог
create table if not exists public.categories (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fillings (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  category_id bigint not null references public.categories(id) on delete restrict,
  description text,
  price numeric(12,2) not null default 0,
  base_weight numeric(8,2),
  event_types event_type[] not null default '{}',
  filling_ids bigint[] not null default '{}',
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Акции и купоны
create table if not exists public.promotions (
  id bigserial primary key,
  name text not null,
  description text,
  discount_percent numeric(5,2),
  discount_amount numeric(12,2),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  promo_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.promotion_products (
  promotion_id bigint references public.promotions(id) on delete cascade,
  product_id bigint references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

-- Отзывы
create table if not exists public.reviews (
  id bigserial primary key,
  product_id bigint references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);

-- Бонусы
create table if not exists public.bonus_transactions (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('earn','spend','adjust')),
  amount int not null,
  order_id bigint,
  created_at timestamptz not null default now()
);

-- Избранное
create table if not exists public.wishlists (
  user_id uuid references public.profiles(id) on delete cascade,
  product_id bigint references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Корзина
create table if not exists public.cart_items (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  options jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_owner check ((user_id is not null) or (session_id is not null))
);

-- Заказы
create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status order_status not null default 'created',
  total numeric(12,2) not null default 0,
  bonus_used int not null default 0,
  bonus_earned int not null default 0,
  promo_code text,
  delivery_method delivery_method not null,
  delivery_price numeric(12,2) not null default 0,
  address jsonb,
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  payment_id text,
  external_delivery_id text,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  cake_design jsonb,
  name_snapshot text not null,
  price numeric(12,2) not null default 0,
  quantity int not null check (quantity > 0)
);

-- Блог и страницы
create table if not exists public.posts (
  id bigserial primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id bigserial primary key,
  slug text unique not null,
  title text not null,
  content text,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Галерея
create table if not exists public.gallery (
  id bigserial primary key,
  image_url text not null,
  title text,
  product_id bigint references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Баннеры
create table if not exists public.banners (
  id bigserial primary key,
  title text not null,
  image_url text not null,
  link text,
  active boolean not null default true,
  sort_order int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- Уведомления
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Аналитика
create table if not exists public.events (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Сессии
create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Функции и триггеры
create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists set_timestamp_orders on public.orders;
create trigger set_timestamp_orders
before update on public.orders
for each row execute procedure public.trigger_set_timestamp();

drop trigger if exists set_timestamp_cart_items on public.cart_items;
create trigger set_timestamp_cart_items
before update on public.cart_items
for each row execute procedure public.trigger_set_timestamp();

-- Функция для начисления бонусов
create or replace function public.increment_bonus(p_user_id uuid, p_amount int)
returns void language plpgsql as $$
begin
  update public.profiles set bonus_balance = bonus_balance + p_amount where id = p_user_id;
  insert into public.bonus_transactions (user_id, type, amount) values (p_user_id, 'earn', p_amount);
end; $$;

-- Индексы
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_cart_items_owner on public.cart_items(user_id, session_id);
create index if not exists idx_orders_user on public.orders(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.fillings enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.reviews enable row level security;
alter table public.bonus_transactions enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.gallery enable row level security;
alter table public.banners enable row level security;
alter table public.notifications enable row level security;
alter table public.events enable row level security;

-- Политики
-- Публичное чтение справочников/каталога/баннеров/галереи/блога/страниц
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read fillings" on public.fillings for select using (true);
create policy "Public read products" on public.products for select using (active = true);
create policy "Public read promotions" on public.promotions for select using (active = true);
create policy "Public read promotion_products" on public.promotion_products for select using (true);
create policy "Public read posts published" on public.posts for select using (status = 'published');
create policy "Public read pages" on public.pages for select using (published = true);
create policy "Public read gallery" on public.gallery for select using (true);
create policy "Public read banners" on public.banners for select using (active = true);

-- Отзывы
create policy "Public read reviews published" on public.reviews for select using (status = 'published');
create policy "Users insert their reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on public.reviews for update using (auth.uid() = user_id);

-- Профиль
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Избранное
create policy "Users manage wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Корзина
create policy "Read own cart" on public.cart_items for select using (
  auth.uid() = user_id
  or session_id = current_setting('app.session_id', true)
);
create policy "Insert own cart" on public.cart_items for insert with check (
  (auth.uid() = user_id) or (session_id = current_setting('app.session_id', true) and user_id is null)
);
create policy "Update own cart" on public.cart_items for update using (
  auth.uid() = user_id
  or session_id = current_setting('app.session_id', true)
);
create policy "Delete own cart" on public.cart_items for delete using (
  auth.uid() = user_id
  or session_id = current_setting('app.session_id', true)
);

-- Заказы
create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users update own orders (limited)" on public.orders for update using (auth.uid() = user_id);

create policy "Users read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Users insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Бонусы
create policy "Users read own bonus transactions" on public.bonus_transactions for select using (auth.uid() = user_id);
create policy "Users insert own bonus transactions" on public.bonus_transactions for insert with check (auth.uid() = user_id);

-- Уведомления
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- События
create policy "Insert events" on public.events for insert with check (true);
create policy "Users read own events" on public.events for select using (auth.uid() = user_id);
