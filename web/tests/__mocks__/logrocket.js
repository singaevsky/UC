// file: tests/__mocks__/logrocket.js

// ✅ Мок LogRocket
const mockLogRocket = {
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),

  // ✅ Мок для setUserIDGenerator
  setUserIDGenerator: jest.fn(),

  // ✅ Мок для addRawMetadata
  addRawMetadata: jest.fn(),

  // ✅ Мок для getSessionURL
  getSessionURL: jest.fn(() => 'https://app.logrocket.com/test/session'),

  // ✅ Мок для redact
  redact: jest.fn(),

  // ✅ Мок для type
  type: jest.fn(),

  // ✅ Мок для click
  click: jest.fn(),

  // ✅ Мок для swipe
  swipe: jest.fn(),

  // ✅ Мок для form
  form: jest.fn(),

  // ✅ Мок для clearForms
  clearForms: jest.fn(),

  // ✅ Мок для record
  record: jest.fn(),

  // ✅ Мок для store
  store: jest.fn(),

  // ✅ Мок для getIdentifiedUser
  getIdentifiedUser: jest.fn(() => null),

  // ✅ Мок для isEnabled
  isEnabled: jest.fn(() => true),

  // ✅ Мок для anonymize
  anonymize: jest.fn(),

  // ✅ Мок для GDPR compliance
  gdpr: {
    anonymize: jest.fn(),
    forget: jest.fn(),
    optOut: jest.fn(),
    optIn: jest.fn(),
    optStatus: jest.fn(() => 'unknown'),
  },

  // ✅ Мок для player
  player: {
    pause: jest.fn(),
    resume: jest.fn(),
    seek: jest.fn(),
    speed: jest.fn(),
    volume: jest.fn(),
    muted: jest.fn(),
  },

  // ✅ Мок для network
  network: {
    isEnabled: jest.fn(() => true),
    getRequests: jest.fn(() => []),
    getResponses: jest.fn(() => []),
  },

  // ✅ Мок для performance
  performance: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntries: jest.fn(() => []),
  },

  // ✅ Мок для session
  session: {
    getSessionURL: jest.fn(() => 'https://app.logrocket.com/test/session'),
    pause: jest.fn(),
    resume: jest.fn(),
    restart: jest.fn(),
    share: jest.fn(),
  },

  // ✅ Мок для dom
  dom: {
    isEnabled: jest.fn(() => true),
    getElements: jest.fn(() => []),
    getSnapshot: jest.fn(() => 'snapshot'),
  },

  // ✅ Мок для console
  console: {
    isEnabled: jest.fn(() => true),
    getMessages: jest.fn(() => []),
  },

  // ✅ Мок для metadata
  metadata: {
    set: jest.fn(),
    get: jest.fn(() => null),
    clear: jest.fn(),
  },

  // ✅ Мок для integrations
  integrations: {
    Slack: jest.fn(),
    Jira: jest.fn(),
    ServiceNow: jest.fn(),
    Datadog: jest.fn(),
  },

  // ✅ Константы
  VERSION: '7.0.0',
  PLUGIN_NAME: 'logrocket',

  // ✅ Метод для очистки моков
  clearMocks: () => {
    Object.values(mockLogRocket).forEach((mockFn) => {
      if (typeof mockFn === 'function' && mockFn.mockClear) {
        mockFn.mockClear();
      }

      // Очищаем вложенные объекты
      if (typeof mockFn === 'object' && mockFn !== null) {
        Object.values(mockFn).forEach((innerMock) => {
          if (typeof innerMock === 'function' && innerMock.mockClear) {
            innerMock.mockClear();
          }
        });
      }
    });
  },
};

// ✅ Функция для создания пользователя в тестах
const mockIdentifyUser = (userId, userInfo = {}) => {
  mockLogRocket.identify(userId, {
    id: userId,
    email: userInfo.email || 'test@example.com',
    name: userInfo.name || 'Test User',
    createdAt: new Date().toISOString(),
    ...userInfo,
  });
};

// ✅ Функция для создания тестовых событий
const mockTrackEvent = (eventName, properties = {}) => {
  mockLogRocket.track(eventName, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

// ✅ Экспорт
module.exports = {
  ...mockLogRocket,
  mockIdentifyUser,
  mockTrackEvent,
  // ✅ Default export для совместимости
  default: mockLogRocket,
};
