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
('Мята','myanta','Освежающий вкус'),
('Карамель','karamel','Соленая карамель'),
('Манго','mango','Экзотический тропический вкус')
on conflict (slug) do nothing;

-- Товары
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

with cat as (select id from public.categories where slug='torty' limit 1)
insert into public.products (name, slug, category_id, description, price, base_weight, event_types, filling_ids, images)
select 'Торт "Птичье молоко"', 'tort-ptichye-moloko', c.id, 'Классический торт с нежным суфле', 2200.00, 2.5, ARRAY['wedding','anniversary'], ARRAY[(select id from public.fillings where slug='ptichye-moloko')], ARRAY['/images/polye1.jpg','/images/polye2.jpg']
from cat c
on conflict (slug) do nothing;

with cat as (select id from public.categories where slug='desserty' limit 1)
insert into public.products (name, slug, category_id, description, price, base_weight, event_types, filling_ids, images)
select 'Тирамису', 'tiramisu', c.id, 'Итальянский десерт с маскарпоне', 450.00, 0.5, ARRAY['birthday','other'], ARRAY[(select id from public.fillings where slug='karamel')], ARRAY['/images/tiramisu1.jpg']
from cat c
on conflict (slug) do nothing;

-- Баннеры
insert into public.banners (title, image_url, link, sort_order) values
('Скидка 10% на торты','/images/banner1.jpg','/promos',1),
('Конструктор тортов','/images/banner2.jpg','/constructor',2),
('Доставка в день заказа','/images/banner3.jpg','/delivery',3)
on conflict do nothing;

-- Галерея
insert into public.gallery (image_url, title) values
('/images/work1.jpg','Свадебный торт с цветами'),
('/images/work2.jpg','Детский торт "Машинка"'),
('/images/work3.jpg','Шоколадный торт с ягодами'),
('/images/work4.jpg','Торт "Единорог"'),
('/images/work5.jpg','Наполеон классический'),
('/images/work6.jpg','Капкейки на праздник')
on conflict do nothing;

-- Блог
insert into public.posts (title, slug, excerpt, content, status, published_at) values
('Как выбрать начинку для торта?','kak-vybrat-nachinku','Советы профессионального кондитера по выбору начинки','<h2>Основные критерии выбора</h2><p>При выборе начинки для торта важно учитывать несколько факторов...</p>', 'published', now()),
('История кондитерского искусства','istoriya-konditerstva','От древних времен до наших дней','<h2>Древние времена</h2><p>Уже в древнем Египте существовали первые кондитерские изделия...</p>', 'published', now()),
('Секреты идеального бисквита','sekrety-biskvita','Профессиональные советы от шеф-кондитера','<h2>Ингредиенты</h2><p>Качественные ингредиенты — основа успеха...</p>', 'published', now())
on conflict (slug) do nothing;

-- Промо
insert into public.promotions (name, description, discount_percent, promo_code, active, starts_at, ends_at) values
('Весенняя скидка 10%','Скидка 10% на все торты по промокоду SPRING10',10.00,'SPRING10',true, now(), now() + interval '30 days'),
('День рождения скидка 15%','Именинникам скидка 15% по промокоду BIRTHDAY',15.00,'BIRTHDAY',true, now(), now() + interval '60 days'),
('Скидка 500 рублей при заказе от 3000','Скидка 500 рублей по промокоду SAVE500',null,'SAVE500',true, now(), now() + interval '14 days')
on conflict do nothing;

-- Статичные страницы
insert into public.pages (slug, title, content, published) values
('delivery','Доставка и оплата','<h2>Способы доставки</h2><p>Мы предлагаем несколько удобных способов доставки ваших заказов...</p>', true),
('contacts','Контакты','<h2>Как с нами связаться</h2><p>Телефон: +7 (999) 000-00-00</p><p>Email: hello@konditer.ru</p>', true),
('about','О нас','<h2>Наша история</h2><p>Кондитерская "Уездный кондитер" была основана в 2018 году...</p>', true)
on conflict (slug) do nothing;
