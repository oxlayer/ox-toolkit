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
      '**/out/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.specify/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/*.min.js',
      '**/templates/**',
      '**/*.template.ts',
      '**/__tests__/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
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
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      // Soft enforcement (warn) until existing call sites migrate to the
      // centralized env loader. New code should use
      // @oxlayer/capabilities-internal/env. Tighten back to "error" once
      // the legacy reads under apps/ and capabilities/adapters/ are
      // migrated.
      'no-restricted-properties': [
        'warn',
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
    // Files that are allowed to read process.env directly
    files: [
      '**/internal/env/**',
      '**/env.ts',
      '**/env.js',
      '**/*.config.{ts,js,mjs,cjs}',
      '**/scripts/**',
      '**/bin/**',
      '**/cli/**',
      '**/scripts/sdk-release/**',
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
