export default {
  /**
   * Global type checking
   * Validates integrity across the project without emitting files
   */
  'src/**/*.ts': () => 'tsc -p tsconfig.json --noEmit',

  /**
   * Linting, Formatting and Unit Testing
   * Runs only on staged files to ensure code quality and prevent regressions
   */
  '**/*.{js,jsx,ts,tsx,mts,mjs}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests',
  ],

  /**
   * Documentation and Configuration files
   */
  '**/*.{md,json}': 'prettier --write',

  /**
   * Infrastructure and CI/CD configuration
   */
  '**/*.{yml,yaml}': 'prettier --write',
};
