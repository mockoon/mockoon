import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';
import { configs } from '../../shared/eslint.config.mjs';

configs[1].extends = [...configs[1].extends, ...angular.configs.tsRecommended];
configs[1].rules = {
  ...configs[1].rules,
  '@angular-eslint/directive-selector': [
    'error',
    {
      type: 'attribute',
      prefix: 'app',
      style: 'camelCase'
    }
  ],
  '@angular-eslint/component-selector': [
    'error',
    {
      type: 'element',
      prefix: 'app',
      style: 'kebab-case'
    }
  ],
  '@angular-eslint/prefer-on-push-component-change-detection': 'error',
  // this should be reenabled once we use strictNullChecks
  '@typescript-eslint/prefer-nullish-coalescing': 'off'
};

export default tseslint.config(...configs, {
  files: ['test/**/*.ts'],
  rules: {
    '@typescript-eslint/no-empty-function': 'off'
  }
});
