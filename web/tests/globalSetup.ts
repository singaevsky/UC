// file: tests/globalSetup.ts
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ✅ Настройка глобального тестового окружения
module.exports = async function globalSetup() {
  console.log('🚀 Starting global test setup...');

  // ✅ Создаем директорию для test-results если её нет
  const testResultsDir = join(process.cwd(), 'test-results');
  if (!existsSync(testResultsDir)) {
    mkdirSync(testResultsDir, { recursive: true });
  }

  // ✅ Создаем coverage директорию если её нет
  const coverageDir = join(process.cwd(), 'coverage');
  if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir, { recursive: true });
  }

  // ✅ Проверяем наличие базы данных для тестов
  // Если используется Supabase или другая БД для тестов
  const testEnvExists = process.env.TEST_DATABASE_URL || process.env.SUPABASE_TEST_URL;
  if (!testEnvExists) {
    console.warn('⚠️  TEST_DATABASE_URL or SUPABASE_TEST_URL not set. Tests may fail.');
  }

  // ✅ Очищаем кеш Next.js перед тестами
  try {
    execSync('rm -rf .next', { stdio: 'inherit' });
    console.log('✅ Next.js cache cleared');
  } catch (error) {
    console.warn('⚠️  Could not clear Next.js cache:', error);
  }

  // ✅ Создаем временные файлы конфигурации если нужно
  const tempConfigPath = join(process.cwd(), 'jest.temp.config.js');
  if (!existsSync(tempConfigPath)) {
    const tempConfig = `
// Временный конфиг для тестов
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
};
`;
    writeFileSync(tempConfigPath, tempConfig);
    console.log('✅ Temporary Jest config created');
  }

  // ✅ Проверяем доступность портов для тестов
  const testPorts = [3000, 3001, 54321]; // Next.js dev port, test port, Supabase port
  for (const port of testPorts) {
    try {
      const isPortTaken = execSync(`lsof -i :${port}`, { stdio: 'pipe' });
      if (isPortTaken) {
        console.warn(`⚠️  Port ${port} is already in use`);
      }
    } catch {
      // Порт свободен, это хорошо
    }
  }

  // ✅ Проверяем переменные окружения для тестов
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // ✅ Создаем mock файлы если они отсутствуют
  const mocksDir = join(process.cwd(), 'tests', '__mocks__');
  if (!existsSync(mocksDir)) {
    mkdirSync(mocksDir, { recursive: true });
    console.log('✅ Mocks directory created');
  }

  // ✅ Устанавливаем таймаут для длительных операций
  jest.setTimeout(60000); // 60 секунд

  console.log('✅ Global test setup completed');
};
