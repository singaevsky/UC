// file: tests/__mocks__/fileMock.js

// ✅ Мок для всех типов файлов в тестах
module.exports = 'test-file-stub';

// ✅ Альтернативный вариант с более детальным моком
module.exports = {
  __esModule: true,
  default: 'test-file-stub',

  // ✅ Метод для получения URL файла
  getUrl: () => 'https://test-files.com/test-image.jpg',

  // ✅ Метод для получения размера файла
  getSize: () => 1024,

  // ✅ Метод для получения типа файла
  getType: () => 'image/jpeg',

  // ✅ Метод для проверки, является ли файл изображением
  isImage: () => true,

  // ✅ Метод для получения метаданных файла
  getMetadata: () => ({
    name: 'test-image.jpg',
    size: 1024,
    type: 'image/jpeg',
    lastModified: Date.now(),
  }),
};
