-- file: supabase/migrations/20250905_draft_cakes.sql

-- ✅ Создание типа для статусов черновиков
CREATE TYPE IF NOT EXISTS draft_status AS ENUM (
  'draft',
  'active',
  'converted_to_order',
  'archived',
  'deleted'
);

-- ✅ Создание таблицы черновиков тортов
CREATE TABLE IF NOT EXISTS public.draft_cakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- ✅ Основные поля
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status draft_status NOT NULL DEFAULT 'draft',

  -- ✅ Временные метки
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,

  -- ✅ Дополнительные метаданные
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NULL,
  description TEXT NULL,

  -- ✅ Связи
  converted_order_id UUID NULL REFERENCES public.orders (id) ON DELETE SET NULL,
  parent_draft_id UUID NULL REFERENCES public.draft_cakes (id) ON DELETE SET NULL,

  -- ✅ Поля для оптимизации
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 0,

  -- ✅ Soft delete support
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- ✅ Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_draft_cakes_user_id ON public.draft_cakes (user_id);
CREATE INDEX IF NOT EXISTS idx_draft_cakes_status ON public.draft_cakes (status);
CREATE INDEX IF NOT EXISTS idx_draft_cakes_updated_at ON public.draft_cakes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_cakes_created_at ON public.draft_cakes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_cakes_user_status ON public.draft_cakes (user_id, status);
CREATE INDEX IF NOT EXISTS idx_draft_cakes_config_gin ON public.draft_cakes USING gin (config);

-- ✅ Partial индекс для активных черновиков
CREATE INDEX IF NOT EXISTS idx_draft_cakes_active ON public.draft_cakes (user_id, updated_at DESC)
WHERE status = 'draft' AND is_deleted = false;

-- ✅ Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_draft_cakes_updated_at ON public.draft_cakes;
CREATE TRIGGER update_draft_cakes_updated_at
    BEFORE UPDATE ON public.draft_cakes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ✅ Функция для обновления last_accessed_at
CREATE OR REPLACE FUNCTION public.update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = now();
    NEW.access_count = OLD.access_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Функция для soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_draft()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_deleted = true;
    NEW.deleted_at = now();
    NEW.status = 'deleted';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Политики Row Level Security (RLS)
ALTER TABLE public.draft_cakes ENABLE ROW LEVEL SECURITY;

-- ✅ Политика: пользователи могут видеть только свои черновики
DROP POLICY IF EXISTS "Users can view own drafts" ON public.draft_cakes;
CREATE POLICY "Users can view own drafts" ON public.draft_cakes
  FOR SELECT
  USING (
    auth.uid() = user_id AND
    (is_deleted = false OR status = 'deleted')
  );

-- ✅ Политика: пользователи могут создавать свои черновики
DROP POLICY IF EXISTS "Users can create own drafts" ON public.draft_cakes;
CREATE POLICY "Users can create own drafts" ON public.draft_cakes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ Политика: пользователи могут обновлять свои черновики
DROP POLICY IF EXISTS "Users can update own drafts" ON public.draft_cakes;
CREATE POLICY "Users can update own drafts" ON public.draft_cakes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ Политика: пользователи могут удалять свои черновики (soft delete)
DROP POLICY IF EXISTS "Users can delete own drafts" ON public.draft_cakes;
CREATE POLICY "Users can delete own drafts" ON public.draft_cakes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ✅ Политика для восстановления удаленных черновиков
DROP POLICY IF EXISTS "Users can restore own drafts" ON public.draft_cakes;
CREATE POLICY "Users can restore own drafts" ON public.draft_cakes
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    is_deleted = true
  )
  WITH CHECK (
    auth.uid() = user_id AND
    is_deleted = false
  );

-- ✅ Функция для автоматического обновления last_accessed_at
DROP TRIGGER IF EXISTS update_draft_cakes_access ON public.draft_cakes;
CREATE TRIGGER update_draft_cakes_access
  BEFORE SELECT ON public.draft_cakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_accessed_at();

-- ✅ Комментарии для документации
COMMENT ON TABLE public.draft_cakes IS 'Черновики тортов пользователей';
COMMENT ON COLUMN public.draft_cakes.id IS 'Уникальный идентификатор черновика';
COMMENT ON COLUMN public.draft_cakes.user_id IS 'ID пользователя-владельца';
COMMENT ON COLUMN public.draft_cakes.config IS 'JSON конфигурация торта';
COMMENT ON COLUMN public.draft_cakes.status IS 'Статус черновика (draft, active, converted_to_order, archived, deleted)';
COMMENT ON COLUMN public.draft_cakes.version IS 'Версия черновика для отслеживания изменений';
COMMENT ON COLUMN public.draft_cakes.parent_draft_id IS 'ID родительского черновика (для форков)';
COMMENT ON COLUMN public.draft_cakes.converted_order_id IS 'ID заказа, созданного из этого черновика';
COMMENT ON COLUMN public.draft_cakes.is_deleted IS 'Признак мягкого удаления';
COMMENT ON COLUMN public.draft_cakes.last_accessed_at IS 'Время последнего доступа к черновику';
COMMENT ON COLUMN public.draft_cakes.access_count IS 'Количество обращений к черновику';

-- ✅ Создание представления для активных черновиков
CREATE OR REPLACE VIEW public.active_draft_cakes AS
SELECT
  id,
  user_id,
  config,
  status,
  title,
  description,
  created_at,
  updated_at,
  last_accessed_at,
  access_count,
  parent_draft_id,
  converted_order_id,
  version
FROM public.draft_cakes
WHERE is_deleted = false
  AND status IN ('draft', 'active');

-- ✅ Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION public.get_user_draft_stats(user_uuid UUID)
RETURNS TABLE (
  total_drafts BIGINT,
  active_drafts BIGINT,
  converted_drafts BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_drafts,
    COUNT(*) FILTER (WHERE status = 'draft' AND is_deleted = false)::BIGINT as active_drafts,
    COUNT(*) FILTER (WHERE status = 'converted_to_order')::BIGINT as converted_drafts,
    MAX(updated_at) as last_activity
  FROM public.draft_cakes
  WHERE user_id = user_uuid AND is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
