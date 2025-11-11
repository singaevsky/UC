// file: tests/globalTeardown.ts
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

// ✅ Очистка после всех тестов
module.exports = async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');

  // ✅ Очищаем процессы тестов если нужно
  // Например, если запускали локальную БД или сервер

  // ✅ Очищаем временные файлы
  const tempConfigPath = join(process.cwd(), 'jest.temp.config.js');
  if (existsSync(tempConfigPath)) {
    try {
      rmSync(tempConfigPath);
      console.log('✅ Temporary Jest config removed');
    } catch (error) {
      console.warn('⚠️  Could not remove temporary Jest config:', error);
    }
  }

  // ✅ Очищаем кеш тестов если создан
  const testCacheDir = join(process.cwd(), 'node_modules', '.cache', 'jest');
  if (existsSync(testCacheDir)) {
    try {
      rmSync(testCacheDir, { recursive: true, force: true });
      console.log('✅ Jest cache cleared');
    } catch (error) {
      console.warn('⚠️  Could not clear Jest cache:', error);
    }
  }

  // ✅ Очищаем .next директорию если она создана тестами
  const nextDir = join(process.cwd(), '.next');
  if (existsSync(nextDir)) {
    try {
      // Проверяем, что это тестовая сборка (можно добавить флаг)
      const isTestBuild = process.env.TEST_BUILD === 'true';
      if (isTestBuild) {
        rmSync(nextDir, { recursive: true, force: true });
        console.log('✅ Next.js test build directory cleared');
      }
    } catch (error) {
      console.warn('⚠️  Could not clear Next.js build directory:', error);
    }
  }

  // ✅ Останавливаем процессы тестов если запускали
  try {
    // Например, если запускали локальный Supabase
    execSync('pkill -f supabase', { stdio: 'ignore' });
    console.log('✅ Test processes stopped');
  } catch (error) {
    // Игнорируем ошибки если процессы не найдены
  }

  // ✅ Очищаем environment variables если они были установлены временно
  if (process.env.TEST_BUILD) {
    delete process.env.TEST_BUILD;
  }

  if (process.env.TEST_DATABASE_URL) {
    delete process.env.TEST_DATABASE_URL;
  }

  // ✅ Восстанавливаем оригинальные console методы если они были изменены
  if (typeof console.log.restore === 'function') {
    console.log.restore();
  }

  console.log('✅ Global test teardown completed');
};
