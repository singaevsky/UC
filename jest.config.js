// file: jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // ✅ Путь к Next.js app directory
  dir: './',
});

// ✅ Добавляем custom config для Jest
const customJestConfig = {
  // ✅ Тестовые файлы
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
  ],

  // ✅ Модули для игнорирования
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // ✅ Модули для преобразования
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // ✅ Модули для обработки CSS
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',

    // ✅ Моки для CSS модулей
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',

    // ✅ Моки для изображений
    '^.+\\.(png|jpg|jpeg|gif|webp|svg|ico)$': '<rootDir>/tests/__mocks__/fileMock.js',

    // ✅ Моки для модулей
    '^@supabase/supabase-js$': '<rootDir>/tests/__mocks__/supabase.js',
    '^@sentry/nextjs$': '<rootDir>/tests/__mocks__/sentry.js',
    '^logrocket$': '<rootDir>/tests/__mocks__/logrocket.js',
  },

  // ✅ Настройки для setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupTests.ts',
  ],

  // ✅ Настройки для moduleDirectories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests',
  ],

  // ✅ Настройки для test environment
  testEnvironment: 'jest-environment-jsdom',

  // ✅ Настройки для coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/mocks/**',
    '!src/**/types/**',
    '!src/**/styles/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // ✅ Настройки для verbose output
  verbose: true,

  // ✅ Настройки для clearMocks
  clearMocks: true,
  restoreMocks: true,

  // ✅ Настройки для detectOpenHandles
  detectOpenHandles: true,

  // ✅ Настройки для forceExit
  forceExit: true,

  // ✅ Настройки для maxWorkers
  maxWorkers: '50%',

  // ✅ Настройки для bail
  bail: false,

  // ✅ Настройки для reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],

  // ✅ Настройки для testTimeout
  testTimeout: 30000,

  // ✅ Настройки для globalSetup и globalTeardown
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',

  // ✅ Настройки для testEnvironmentOptions
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // ✅ Настройки для watchPlugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // ✅ Настройки для projects (для monorepo)
  projects: undefined,

  // ✅ Настройки для runner
  runner: 'jest-runner',

  // ✅ Настройки для notify
  notify: false,

  // ✅ Настройки для testLocationInResults
  testLocationInResults: true,

  // ✅ Дополнительные настройки
  testResultsProcessor: undefined,
  testRunner: 'jest-circus/runner',
  testSequencer: '@jest/test-sequencer',
  testURL: 'http://localhost',

  // ✅ Настройки для transformIgnorePatterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // ✅ Настройки для watchPathIgnorePatterns
  watchPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // ✅ Настройки для testRegex
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
};

// ✅ createJestConfig импортирует следующую конфигурацию
module.exports = createJestConfig(customJestConfig);
