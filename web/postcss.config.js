// file: postcss.config.js
module.exports = {
  plugins: {
    // ✅ Tailwind CSS
    tailwindcss: {},

    // ✅ PostCSS Preset Env - поддержка современных CSS возможностей
    'postcss-preset-env': {
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'color-functional-notation': true,
        'hex-alpha': true,
        'case-insensitive-attributes': true,
        'replaced-value': true,
        'focus-within-pseudo-class': true,
        'focus-visible-pseudo-class': true,
        'revert-pseudo-class': true,
        'gap-properties': true,
        'space-start-and-end': true,
        'not-pseudo-class': true,
        'logical-properties-and-values': true,
        'appearance': true,
        'custom-selectors': true,
        'overscroll-behavior': true,
        'font-variant-property': true,
        'offscreen-canvas': true,
        'prefer-color-scheme': true,
        'dir-pseudo-class': true,
        'oddeven-pseudo-class': true,
        'autoprefixer': true,
      },
    },

    // ✅ PostCSS Nested - поддержка вложенных селекторов
    'postcss-nested': {},

    // ✅ PostCSS Comment - для документации в CSS
    'postcss-comment': {},

    // ✅ Autoprefixer
    autoprefixer: {
      grid: 'autoplace',
      flexbox: 'no-2009',
    },

    // ✅ PostCSS Combine Mediaqueries - объединение медиа-запросов
    'postcss-combine-media-query': {},

    // ✅ PostCSS Sorting - сортировка CSS свойств
    'postcss-sorting': {
      order: [
        'custom-properties',
        'dollar-variables',
        'mixins',
        'functions',
        'variables',
        'at-rules',
        'less-mixins',
        'container',
        'content',
        'declarations',
        'rules',
        'print-style',
      ],
      'unspecified-properties-position': 'bottom',
    },

    // ✅ PostCSS Easy Import - для импорта CSS файлов
    'postcss-easy-import': {
      extensions: ['.css', '.pcss'],
      addPartialDirectory: false,
    },
  },
};
