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
        ink: token('color-ink'),
        pop: token('color-pop'),
        'pop-fg': token('color-pop-fg'),
        'pop-blue': token('color-pop-blue'),
      },
      fontFamily: {
        pop: ['Bangers', 'Impact', 'Arial Black', 'system-ui', 'sans-serif'],
      },
      // Harde comic-schaduw zonder vervaging.
      boxShadow: {
        comic: '4px 4px 0 0 rgb(var(--color-ink))',
        'comic-sm': '2px 2px 0 0 rgb(var(--color-ink))',
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
    },
  },
  plugins: [],
} satisfies Config;
