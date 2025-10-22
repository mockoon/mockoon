// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export const configs = [
  { ignores: ['build/**', 'dist/**', 'bin/**', 'tmp/**'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigDirName: import.meta.dirname
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          }
        }
      ],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return'
        }
      ],
      '@stylistic/space-in-parens': ['off', 'never'],
      '@stylistic/spaced-comment': [
        'error',
        'always',
        {
          markers: ['/']
        }
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'no-public'
          },
          ignoredMethodNames: [
            'ngOnInit',
            'ngOnChanges',
            'ngOnDestroy',
            'ngAfterViewInit'
          ]
        }
      ],
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/unified-signatures': [
        'error',
        { ignoreDifferentlyNamedParameters: true }
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-require-imports': [
        'error',
        { allow: ['/package\\.json$', 'crypto'] }
      ],
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: true,
          ignoreIfStatements: true
        }
      ],
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      'arrow-body-style': 'error',
      curly: 'error',
      eqeqeq: ['error', 'smart'],
      'guard-for-in': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': 'error',
      'no-eval': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      radix: 'error'
    }
  },
  eslintPluginPrettier
];

// @ts-ignore
export const fullConfig = tseslint.config(...configs);
