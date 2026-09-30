import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Sensitive values never go through NEXT_PUBLIC_ variables; the build-time
          // policy check (scripts/lint-policy.mjs) also enforces this on raw text.
          selector: 'MemberExpression[property.name=/^NEXT_PUBLIC_/]',
          message: 'NEXT_PUBLIC_ variables are not allowed. Keep configuration server-side.',
        },
      ],
      // role="list" is intentional: Safari drops list semantics when list-style is none.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      'jsx-a11y/anchor-is-valid': 'error',
    },
  },
]

export default config
