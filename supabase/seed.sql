-- Заполним базовые справочники
insert into public.categories (name, slug) values
('Торты','torty'),
('Десерты','deserty'),
('Кексы','keksy')
on conflict (slug) do nothing;

insert into public.fillings (name, slug, description) values
('Клубника','klubnika','Классический ягодный вкус'),
('Шоколад','shokolad','Насыщенный какао'),
('Птичье молоко','ptichye-moloko','Нежное суфле'),
('Мята','myanta','Освежающий вкус')
on conflict (slug) do nothing;

-- Товары (цены в рублях)
with cat as (select id from public.categories where slug='torty' limit 1)
insert into public.products (name, slug, category_id, description, price, base_weight, event_types, filling_ids, images)
select 'Торт "Клубничный"', 'tort-klubnichnyi', c.id, 'Нежный бисквит с клубникой', 1800.00, 1.5, ARRAY['wedding','birthday'], ARRAY[(select id from public.fillings where slug='klubnika')], ARRAY['/images/clubnika1.jpg','/images/clubnika2.jpg']
from cat c
on conflict (slug) do nothing;

with cat as (select id from public.categories where slug='torty' limit 1)
insert into public.products (name, slug, category_id, description, price, base_weight, event_types, filling_ids, images)
select 'Торт "Шоколадный"', 'tort-shokoladnyi', c.id, 'Влажный шоколадный бисквит', 2000.00, 2.0, ARRAY['corporate','birthday'], ARRAY[(select id from public.fillings where slug='shokolad')], ARRAY['/images/choco1.jpg','/images/choco2.jpg']
from cat c
on conflict (slug) do nothing;

-- Баннеры
insert into public.banners (title, image_url, link, sort_order) values
('Скидка 10% на торты','/images/banner1.jpg','/promos',1),
('Конструктор тортов','/images/banner2.jpg','/constructor',2)
on conflict do nothing;

-- Галерея
insert into public.gallery (image_url, title) values
('/images/work1.jpg','Работа 1'),
('/images/work2.jpg','Работа 2')
on conflict do nothing;

-- Блог
insert into public.posts (title, slug, excerpt, content, status, published_at) values
('Как выбрать начинку?','kak-vybrat-nachinku','Советы кондитера','Полезные рекомендации по начинкам...','published',now()),
('История кондитерской','istoriya','О нас','Мы — «Уездный кондитер»...','published',now())
on conflict (slug) do nothing;

-- Промо
insert into public.promotions (name, description, discount_percent, promo_code, active, starts_at, ends_at) values
('Весенняя скидка 10%','Скидка 10% по промокоду SPRING10',10.00,'SPRING10',true, now(), now() + interval '30 days')
on conflict do nothing;
