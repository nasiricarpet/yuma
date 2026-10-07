import eslintPluginImport from 'eslint-plugin-import';

/**
 * کانفیگ پایه ESLint — اپ‌ها و پکیج‌ها این را extend می‌کنند.
 * قوانین مخصوص RTL و فارسی: هیچ محدودیتی روی متن فارسی در رشته‌ها نیست.
 */
export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
