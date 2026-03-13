// @ts-check
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: {
          /**
           * Allows ESLint to parse files not included in tsconfig.json
           * This fixes the parsing error for root config files.
           */
          allowDefaultProject: [
            'eslint.config.mjs',
            'commitlint.config.mjs',
            'lint-staged.config.mjs',
            'jest.config.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    /**
     * Relax rules for testing files to allow Jest spies and mocks
     * without "unbound-method" or context-related linting errors.
     */
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);

export default config;

