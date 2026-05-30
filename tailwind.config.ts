import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/screens/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "outline-variant": "var(--color-outline-variant, #c2c6d4)",
        "secondary": "#526069",
        "surface-container-highest": "var(--color-surface-container-highest, #e1e3e4)",
        "surface-container": "var(--color-surface-container, #edeeef)",
        "primary-fixed": "#d7e2ff",
        "on-secondary": "#ffffff",
        "on-primary": "#ffffff",
        "error-container": "#ffdad6",
        "surface-container-low": "var(--color-surface-container-low, #f3f4f5)",
        "tertiary-fixed-dim": "#c6c6c7",
        "primary-container": "#0056b3",
        "tertiary-fixed": "#e2e2e2",
        "primary-fixed-dim": "#acc7ff",
        "on-tertiary-container": "#cfd0d0",
        "inverse-on-surface": "#f0f1f2",
        "tertiary": "#404242",
        "on-secondary-fixed": "#0f1d25",
        "background": "var(--color-background, #f8f9fa)",
        "surface-container-high": "var(--color-surface-container-high, #e7e8e9)",
        "on-primary-fixed-variant": "#004491",
        "on-primary-fixed": "#001a40",
        "on-surface-variant": "var(--color-on-surface-variant, #424752)",
        "on-background": "#191c1d",
        "surface-container-lowest": "var(--color-surface-container-lowest, #ffffff)",
        "surface-bright": "var(--color-surface-bright, #f8f9fa)",
        "surface": "var(--color-surface, #f8f9fa)",
        "on-secondary-fixed-variant": "#3b4951",
        "secondary-fixed": "#d6e5ef",
        "secondary-container": "#d3e2ed",
        "error": "#ba1a1a",
        "surface-tint": "#115cb9",
        "primary": "#003f87",
        "secondary-fixed-dim": "#bac9d3",
        "outline": "var(--color-outline, #727784)",
        "on-tertiary-fixed-variant": "#454747",
        "on-secondary-container": "#56656e",
        "inverse-surface": "var(--color-inverse-surface, #2e3132)",
        "tertiary-container": "#575959",
        "on-error-container": "#93000a",
        "on-surface": "var(--color-on-surface, #191c1d)",
        "on-tertiary": "#ffffff",
        "surface-dim": "var(--color-surface-dim, #d9dadb)",
        "on-error": "#ffffff",
        "on-primary-container": "#bbd0ff",
        "surface-variant": "var(--color-outline-variant, #e1e3e4)",
        "on-tertiary-fixed": "#1a1c1c",
        "inverse-primary": "#acc7ff"
      },
      spacing: {
        "gutter-mobile": "16px",
        "margin-mobile": "20px",
        "stack-sm": "4px",
        "base": "8px",
        "stack-md": "12px",
        "stack-lg": "24px"
      },
      fontFamily: {
        "label-md": ["Inter"],
        "body-lg": ["Inter"],
        "headline-sm": ["Inter"],
        "body-md": ["Inter"],
        "headline-lg-mobile": ["Inter"],
        "headline-md": ["Inter"],
        "label-sm": ["Inter"],
        "headline-lg": ["Inter"]
      },
      fontSize: {
        "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-sm": ["18px", {"lineHeight": "24px", "fontWeight": "600"}],
        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-lg-mobile": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "label-sm": ["11px", {"lineHeight": "14px", "fontWeight": "500"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}]
      }
    },
  },
  plugins: [],
}

export default config
