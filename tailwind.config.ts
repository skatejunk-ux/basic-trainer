import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('color-bg'),
        surface: token('color-surface'),
        'surface-2': token('color-surface-2'),
        border: token('color-border'),
        fg: token('color-fg'),
        muted: token('color-muted'),
        accent: token('color-accent'),
        'accent-fg': token('color-accent-fg'),
        danger: token('color-danger'),
        success: token('color-success'),
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
    },
  },
  plugins: [],
} satisfies Config;
