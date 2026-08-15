// Root ESLint (flat config). Deliberately minimal in the foundation phase:
// strict type-aware rules arrive with the first real domain module.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/migrations/**',
      '**/next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Boundary rule (DEVELOPMENT_RULES §3): provider SDKs only inside their gateway package.
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'pg', message: 'Import pg only inside @senstar/db.' }] },
      ],
    },
  },
  {
    // Each gateway package is exempt from its own boundary rule.
    files: ['packages/db/**', 'packages/jobs/**', 'packages/observability/**', 'packages/auth/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
