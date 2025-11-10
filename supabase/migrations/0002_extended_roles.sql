-- Добавляем новые роли
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'confectioner';
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'supervisor';

-- Создаем таблицу для управления сменами и задачами
CREATE TABLE IF NOT EXISTS public.shifts (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  status text not null default 'active' check (status in ('active','break','ended')),
  created_at timestamptz not null default now()
);

-- Создаем таблицу для задач
CREATE TABLE IF NOT EXISTS public.tasks (
  id bigserial primary key,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  order_id bigint references public.orders(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  due_date timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Создаем таблицу для производственных этапов
CREATE TABLE IF NOT EXISTS public.production_stages (
  id bigserial primary key,
  order_item_id bigint references public.order_items(id) on delete cascade,
  stage_name text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','quality_check','completed')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Создаем таблицу для отчетов
CREATE TABLE IF NOT EXISTS public.reports (
  id bigserial primary key,
  type text not null check (type in ('daily','weekly','monthly','custom')),
  title text not null,
  data jsonb not null,
  generated_by uuid references public.profiles(id) on delete set null,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Создаем таблицу для складских операций
CREATE TABLE IF NOT EXISTS public.warehouse_operations (
  id bigserial primary key,
  operation_type text not null check (operation_type in ('purchase','usage','adjustment','waste')),
  product_name text not null,
  quantity numeric(10,2) not null,
  unit text not null,
  cost_per_unit numeric(10,2),
  total_cost numeric(10,2),
  supplier text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Создаем таблицу для клиентских коммуникаций
CREATE TABLE IF NOT EXISTS public.client_communications (
  id bigserial primary key,
  order_id bigint references public.orders(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('call','email','sms','meeting','note')),
  direction text not null check (direction in ('incoming','outgoing')),
  content text,
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  follow_up_required boolean not null default false,
  follow_up_date timestamptz
);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_production_stages_order_item ON public.production_stages(order_item_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_status ON public.production_stages(status);
CREATE INDEX IF NOT EXISTS idx_client_communications_order ON public.client_communications(order_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_follow_up ON public.client_communications(follow_up_required, follow_up_date);

-- Функция для создания задач при создании заказа
CREATE OR REPLACE FUNCTION public.create_order_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем задачу для менеджера
  INSERT INTO public.tasks (title, description, assigned_to, order_id, priority, created_by)
  VALUES (
    'Обработка заказа #' || NEW.id,
    'Проверить детали заказа, связаться с клиентом',
    (SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1),
    NEW.id,
    'high',
    NEW.user_id
  );

  -- Создаем задачу для кондитера
  INSERT INTO public.tasks (title, description, assigned_to, order_id, priority, created_by)
  VALUES (
    'Изготовление заказа #' || NEW.id,
    'Подготовить и изготовить торт согласно техническому заданию',
    (SELECT id FROM public.profiles WHERE role = 'confectioner' LIMIT 1),
    NEW.id,
    'high',
    NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для создания задач
DROP TRIGGER IF EXISTS trigger_create_order_tasks ON public.orders;
CREATE TRIGGER trigger_create_order_tasks
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_order_tasks();

-- RLS для новых таблиц
ALTER TABLE public.shifts enable row level security;
ALTER TABLE public.tasks enable row level security;
ALTER TABLE public.production_stages enable row level security;
ALTER TABLE public.reports enable row level security;
ALTER TABLE public.warehouse_operations enable row level security;
ALTER TABLE public.client_communications enable row level security;

-- RLS политики
-- Смены
CREATE POLICY "Users manage own shifts" ON public.shifts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
CREATE POLICY "Supervisors view all shifts" ON public.shifts for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- Задачи
CREATE POLICY "Users view own tasks" ON public.tasks for select using (auth.uid() = assigned_to);
CREATE POLICY "Users update own tasks" ON public.tasks for update using (auth.uid() = assigned_to);
CREATE POLICY "Managers create tasks" ON public.tasks for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager','supervisor','admin'))
);
CREATE POLICY "Supervisors view all tasks" ON public.tasks for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- Производственные этапы
CREATE POLICY "Confectioners view assigned stages" ON public.production_stages for select using (
  auth.uid() = assigned_to or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);
CREATE POLICY "Confectioners update assigned stages" ON public.production_stages for update using (auth.uid() = assigned_to);
CREATE POLICY "Managers create stages" ON public.production_stages for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager','supervisor','admin'))
);

-- Отчеты
CREATE POLICY "Supervisors view all reports" ON public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);
CREATE POLICY "Supervisors create reports" ON public.reports for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);

-- Складские операции
CREATE POLICY "Managers view warehouse operations" ON public.warehouse_operations for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager','supervisor','admin'))
);
CREATE POLICY "Managers create warehouse operations" ON public.warehouse_operations for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager','supervisor','admin'))
);

-- Клиентские коммуникации
CREATE POLICY "Managers view assigned communications" ON public.client_communications for select using (
  auth.uid() = manager_id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
);
CREATE POLICY "Managers create communications" ON public.client_communications for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager','supervisor','admin'))
);
CREATE POLICY "Clients view own communications" ON public.client_communications for select using (
  auth.uid() = client_id
);
