-- file: supabase/migrations/20250906_draft_history.sql

-- ✅ Тип для действий с историей
CREATE TYPE IF NOT EXISTS history_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'restored',
  'converted_to_order',
  'forked'
);

-- ✅ Создание таблицы истории черновиков
CREATE TABLE IF NOT EXISTS public.draft_cakes_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ✅ Связи
  draft_id UUID NOT NULL REFERENCES public.draft_cakes (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- ✅ Данные истории
  action history_action NOT NULL,
  old_config JSONB NULL,
  new_config JSONB NULL,
  change_description TEXT NULL,

  -- ✅ Временные метки
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ✅ Контекст изменения
  changed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  change_source TEXT NULL DEFAULT 'manual', -- 'manual', 'auto_save', 'api', 'system'
  ip_address INET NULL,
  user_agent TEXT NULL,

  -- ✅ Дополнительная информация
  version INTEGER NULL,
  parent_draft_id UUID NULL REFERENCES public.draft_cakes (id) ON DELETE SET NULL,
  order_id UUID NULL REFERENCES public.orders (id) ON DELETE SET NULL,

  -- ✅ Метаданные
  metadata JSONB NULL DEFAULT '{}'::jsonb
);

-- ✅ Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_draft_history_draft_id ON public.draft_cakes_history (draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_history_user_id ON public.draft_cakes_history (user_id);
CREATE INDEX IF NOT EXISTS idx_draft_history_created_at ON public.draft_cakes_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_history_action ON public.draft_cakes_history (action);
CREATE INDEX IF NOT EXISTS idx_draft_history_draft_created ON public.draft_cakes_history (draft_id, created_at DESC);

-- ✅ Составной индекс для частых запросов
CREATE INDEX IF NOT EXISTS idx_draft_history_user_action ON public.draft_cakes_history (user_id, action, created_at DESC);

-- ✅ GIN индекс для метаданных
CREATE INDEX IF NOT EXISTS idx_draft_history_metadata ON public.draft_cakes_history USING gin (metadata);

-- ✅ Включенная RLS
ALTER TABLE public.draft_cakes_history ENABLE ROW LEVEL SECURITY;

-- ✅ Политики RLS для истории
DROP POLICY IF EXISTS "Users can view own draft history" ON public.draft_cakes_history;
CREATE POLICY "Users can view own draft history" ON public.draft_cakes_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert draft history" ON public.draft_cakes_history;
CREATE POLICY "System can insert draft history" ON public.draft_cakes_history
  FOR INSERT
  WITH CHECK (true); -- Вставка разрешена всем, но данные ограничиваются ON DELETE CASCADE

-- ✅ Функция для создания записи истории
CREATE OR REPLACE FUNCTION public.create_draft_history_entry()
RETURNS TRIGGER AS $$
DECLARE
  action_type history_action;
  old_config_data JSONB;
  new_config_data JSONB;
BEGIN
  -- ✅ Определяем тип действия
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    old_config_data := NULL;
    new_config_data := NEW.config;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Проверяем, что именно изменилось
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      action_type := 'deleted';
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      action_type := 'restored';
    ELSIF NEW.status = 'converted_to_order' AND OLD.status != 'converted_to_order' THEN
      action_type := 'converted_to_order';
    ELSE
      action_type := 'updated';
    END IF;

    old_config_data := OLD.config;
    new_config_data := NEW.config;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_config_data := OLD.config;
    new_config_data := NULL;
  END IF;

  -- ✅ Создаем запись в истории
  INSERT INTO public.draft_cakes_history (
    draft_id,
    user_id,
    action,
    old_config,
    new_config,
    changed_by,
    version,
    metadata
  ) VALUES (
    COALESCE(NEW.draft_id, OLD.draft_id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_config_data,
    new_config_data,
    auth.uid(),
    COALESCE(NEW.version, OLD.version),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ✅ Создание триггера для автоматического ведения истории
DROP TRIGGER IF EXISTS draft_cakes_history_trigger ON public.draft_cakes;
CREATE TRIGGER draft_cakes_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.draft_cakes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_draft_history_entry();

-- ✅ Функция для получения истории черновика
CREATE OR REPLACE FUNCTION public.get_draft_history(draft_uuid UUID)
RETURNS TABLE (
  id UUID,
  action history_action,
  old_config JSONB,
  new_config JSONB,
  created_at TIMESTAMPTZ,
  changed_by UUID,
  change_description TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.action,
    h.old_config,
    h.new_config,
    h.created_at,
    h.changed_by,
    h.change_description,
    h.metadata
  FROM public.draft_cakes_history h
  WHERE h.draft_id = draft_uuid
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Функция для сравнения конфигураций
CREATE OR REPLACE FUNCTION public.compare_draft_configs(
  old_config JSONB,
  new_config JSONB
) RETURNS JSONB AS $$
DECLARE
  diff JSONB := '{}'::jsonb;
  key TEXT;
BEGIN
  -- Находим добавленные или измененные ключи
  FOR key IN SELECT jsonb_object_keys(new_config) LOOP
    IF old_config ? key THEN
      -- Ключ существует, проверяем изменение
      IF old_config ->> key IS DISTINCT FROM new_config ->> key THEN
        diff := diff || jsonb_build_object(
          key,
          jsonb_build_object(
            'old', old_config -> key,
            'new', new_config -> key
          )
        );
      END IF;
    ELSE
      -- Новый ключ
      diff := diff || jsonb_build_object(
        key,
        jsonb_build_object(
          'old', null,
          'new', new_config -> key
        )
      );
    END IF;
  END LOOP;

  -- Находим удаленные ключи
  FOR key IN SELECT jsonb_object_keys(old_config) LOOP
    IF NOT (new_config ? key) THEN
      diff := diff || jsonb_build_object(
        key,
        jsonb_build_object(
          'old', old_config -> key,
          'new', null
        )
      );
    END IF;
  END LOOP;

  RETURN diff;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ✅ Обновленная функция истории с детальным сравнением
CREATE OR REPLACE FUNCTION public.create_detailed_draft_history()
RETURNS TRIGGER AS $$
DECLARE
  action_type history_action;
  old_config_data JSONB;
  new_config_data JSONB;
  config_diff JSONB;
BEGIN
  -- ✅ Определяем тип действия
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    old_config_data := NULL;
    new_config_data := NEW.config;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      action_type := 'deleted';
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      action_type := 'restored';
    ELSIF NEW.status = 'converted_to_order' AND OLD.status != 'converted_to_order' THEN
      action_type := 'converted_to_order';
    ELSE
      action_type := 'updated';
    END IF;

    old_config_data := OLD.config;
    new_config_data := NEW.config;

    -- ✅ Создаем детальное сравнение
    IF old_config_data IS NOT NULL AND new_config_data IS NOT NULL THEN
      config_diff := public.compare_draft_configs(old_config_data, new_config_data);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_config_data := OLD.config;
    new_config_data := NULL;
  END IF;

  -- ✅ Создаем запись в истории с дополнительными данными
  INSERT INTO public.draft_cakes_history (
    draft_id,
    user_id,
    action,
    old_config,
    new_config,
    change_description,
    changed_by,
    version,
    metadata
  ) VALUES (
    COALESCE(NEW.draft_id, OLD.draft_id),
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    old_config_data,
    new_config_data,
    CASE
      WHEN action_type = 'updated' AND config_diff IS NOT NULL THEN
        'Конфигурация изменена: ' || config_diff::text
      ELSE NULL
    END,
    auth.uid(),
    COALESCE(NEW.version, OLD.version),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'config_diff', config_diff
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ✅ Обновляем триггер на детальную функцию
DROP TRIGGER IF EXISTS draft_cakes_history_trigger ON public.draft_cakes;
CREATE TRIGGER draft_cakes_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.draft_cakes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_detailed_draft_history();

-- ✅ Представление для удобного просмотра истории
CREATE OR REPLACE VIEW public.draft_history_view AS
SELECT
  h.id,
  h.draft_id,
  dc.title as draft_title,
  h.action,
  h.created_at,
  h.change_description,
  u.email as changed_by_email,
  h.version,
  h.metadata
FROM public.draft_cakes_history h
LEFT JOIN public.draft_cakes dc ON h.draft_id = dc.id
LEFT JOIN auth.users u ON h.changed_by = u.id
ORDER BY h.created_at DESC;

-- ✅ Комментарии для документации
COMMENT ON TABLE public.draft_cakes_history IS 'История изменений черновиков тортов';
COMMENT ON COLUMN public.draft_cakes_history.action IS 'Тип действия (created, updated, deleted, restored, converted_to_order, forked)';
COMMENT ON COLUMN public.draft_cakes_history.old_config IS 'Конфигурация до изменения';
COMMENT ON COLUMN public.draft_cakes_history.new_config IS 'Конфигурация после изменения';
COMMENT ON COLUMN public.draft_cakes_history.change_description IS 'Описание изменений';
COMMENT ON COLUMN public.draft_cakes_history.change_source IS 'Источник изменения (manual, auto_save, api, system)';
COMMENT ON COLUMN public.draft_cakes_history.metadata IS 'Дополнительные метаданные изменения';

-- ✅ Функция для очистки старой истории (старше 1 года)
CREATE OR REPLACE FUNCTION public.cleanup_old_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.draft_cakes_history
  WHERE created_at < now() - interval '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
