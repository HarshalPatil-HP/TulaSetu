// ESLint flat config (ESLint v9+)
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // ── Error prevention ──────────────────────────────────────────────────
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // server-side console logging is fine
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',

      // ── Style ─────────────────────────────────────────────────────────────
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',

      // ── Async safety ──────────────────────────────────────────────────────
      'no-async-promise-executor': 'error',
      'no-return-await': 'error',

      // ── Security-relevant ─────────────────────────────────────────────────
      // Bare empty catch blocks are banned; must at least log the error.
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  {
    // Relax some rules in test files
    files: ['tests/**/*.js'],
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
