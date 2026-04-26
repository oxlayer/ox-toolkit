// Flat ESLint config for IDE integration and complementary checks.
// Fast pre-commit lint is run via oxlint (.oxlintrc.json); ESLint runs in CI
// for rules oxlint doesn't yet support.
//
// https://eslint.org/docs/latest/use/configure/configuration-files

import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/templates/**',
      '**/.turbo/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Use the centralized env loader from @oxlayer/capabilities-internal/env. Declare env schemas in package env.ts files instead.',
        },
      ],
    },
  },
  {
    files: [
      '**/internal/env/**',
      '**/env.ts',
      '**/*.config.{ts,js,mjs,cjs}',
      '**/scripts/**',
      '**/__tests__/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
    ],
    rules: {
      'no-restricted-properties': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
