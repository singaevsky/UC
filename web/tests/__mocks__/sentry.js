// file: tests/__mocks__/sentry.js

// ✅ Мок Sentry
const mockSentry = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  setContext: jest.fn(),
  configureScope: jest.fn(),

  // ✅ Мок для init
  init: jest.fn(),

  // ✅ Мок для startTransaction
  startTransaction: jest.fn(() => ({
    startChild: jest.fn(() => ({
      finish: jest.fn(),
    })),
    finish: jest.fn(),
  })),

  // ✅ Мок для getCurrentHub
  getCurrentHub: jest.fn(() => ({
    getClient: jest.fn(() => ({
      getOptions: jest.fn(() => ({})),
    })),
    pushScope: jest.fn(() => ({
      getScope: jest.fn(() => ({
        setTag: jest.fn(),
        setExtra: jest.fn(),
        setContext: jest.fn(),
      })),
    })),
    popScope: jest.fn(),
  })),

  // ✅ Мок для flush
  flush: jest.fn(() => Promise.resolve(true)),

  // ✅ Мок для close
  close: jest.fn(() => Promise.resolve()),

  // ✅ Мок для withScope
  withScope: jest.fn((callback) => {
    const scope = {
      setTag: jest.fn(),
      setExtra: jest.fn(),
      setContext: jest.fn(),
      setLevel: jest.fn(),
      addBreadcrumb: jest.fn(),
    };
    return callback(scope);
  }),

  // ✅ Мок для SDK
  SDK_NAME: '@sentry/nextjs',
  SDK_VERSION: '7.88.0',

  // ✅ Мок для интеграций
  integrations: {
    httpIntegration: jest.fn(() => ({
      name: 'Http',
      setup: jest.fn(),
    })),
    modulesIntegration: jest.fn(() => ({
      name: 'Modules',
      setup: jest.fn(),
    })),
    onUnhandledRejectionIntegration: jest.fn(() => ({
      name: 'OnUnhandledRejection',
      setup: jest.fn(),
    })),
    onuncaughtExceptionIntegration: jest.fn(() => ({
      name: 'OnUncaughtException',
      setup: jest.fn(),
    })),
    replayIntegration: jest.fn(() => ({
      name: 'Replay',
      setup: jest.fn(),
    })),
    browserTracingIntegration: jest.fn(() => ({
      name: 'BrowserTracing',
      setup: jest.fn(),
    })),
    nextRouterInstrumentation: jest.fn(() => ({
      name: 'NextRouter',
      setup: jest.fn(),
    })),
  },

  // ✅ Мок для SeverityLevel
  SeverityLevel: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Debug: 'debug',
    Log: 'log',
  },

  // ✅ Мок для Transaction
  Transaction: jest.fn(),

  // ✅ Мок для Span
  Span: jest.fn(),

  // ✅ Мок для Scope
  Scope: jest.fn(),

  // ✅ Мок для Hub
  Hub: jest.fn(),

  // ✅ Мок для Client
  Client: jest.fn(),

  // ✅ Мок для integrations
  Integrations: {},
};

// ✅ Функция для очистки вызовов в beforeEach тестов
const clearMocks = () => {
  Object.values(mockSentry).forEach((mockFn) => {
    if (typeof mockFn === 'function' && mockFn.mockClear) {
      mockFn.mockClear();
    }
  });
};

// ✅ Экспорт
module.exports = {
  ...mockSentry,
  clearMocks,
  // ✅ Дополнительный экспорт для convenience
  default: mockSentry,
};
