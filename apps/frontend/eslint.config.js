import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Ignores
  {
    ignores: ['node_modules/**', 'build/**', '.svelte-kit/**', 'dist/**'],
  },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],

  // Global settings
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },

  // Svelte files
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelte.parser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off', // Allow require in config files
      '@typescript-eslint/no-unused-expressions': 'off', // Svelte reactive statements
      'no-console': 'off', // Allow console in frontend for debugging
      'no-shadow-restricted-names': 'off', // Allow Infinity variable name
      'no-self-assign': 'off', // Svelte reactivity pattern
      'no-case-declarations': 'off', // Allow let in case blocks
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'svelte/no-at-html-tags': 'warn',
      'svelte/valid-compile': 'off', // Handled by svelte-check
      'svelte/no-navigation-without-resolve': 'warn',
      'svelte/require-each-key': 'warn',
      'svelte/prefer-svelte-reactivity': 'warn',
      'svelte/no-reactive-literals': 'off', // Svelte pattern
      'svelte/no-immutable-reactive-statements': 'off', // Svelte pattern
    },
  }
);
