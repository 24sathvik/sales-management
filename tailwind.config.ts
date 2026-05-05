import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--brand-primary)',
          dark: 'var(--brand-primary-dark)',
          light: 'var(--brand-primary-light)',
          hover: 'var(--brand-primary-dark)',
        },
        accent: {
          DEFAULT: 'var(--brand-accent)',
          light: 'var(--brand-accent-light)',
          dark: 'var(--brand-accent-dark)',
          muted: 'var(--brand-accent-muted)',
        },
        sidebar: {
          bg: 'var(--bg-sidebar-solid)',
          text: 'var(--text-sidebar)',
          'text-active': 'var(--text-sidebar-active)',
          icon: 'var(--text-sidebar)',
          'icon-active': 'var(--brand-accent)',
          'hover-bg': 'var(--bg-sidebar-hover)',
          'active-bg': 'var(--bg-sidebar-active)',
          'active-border': 'var(--brand-accent)',
        },
        btn: {
          primary: {
            text: 'var(--btn-primary-text)',
          },
          accent: {
            text: 'var(--btn-accent-text)',
          }
        },
        card: {
          DEFAULT: 'var(--bg-card)',
          border: 'var(--border-default)',
        },
        table: {
          header: 'var(--bg-table-header)',
          hover: 'var(--bg-table-row-hover)',
          border: 'var(--border-default)',
        },
        text: {
          primary: 'var(--text-body)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        success: {
          DEFAULT: 'var(--status-success)',
          bg: 'var(--status-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--status-warning)',
          bg: 'var(--status-warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--status-error)',
          bg: 'var(--status-error-bg)',
        },
        info: {
          DEFAULT: 'var(--status-info)',
          bg: 'var(--status-info-bg)',
        },
        badge: {
          draft: 'var(--badge-draft-bg)',
          sent: 'var(--badge-sent-bg)',
          accepted: 'var(--badge-accepted-bg)',
          rejected: 'var(--badge-rejected-bg)',
          active: 'var(--badge-active-bg)',
          closed: 'var(--badge-closed-bg)',
          pending: 'var(--badge-pending-bg)',
          paid: 'var(--badge-paid-bg)',
          partial: 'var(--badge-partial-bg)',
        },
        pipeline: {
          raw: 'var(--stage-raw-bg)',
          design: 'var(--stage-design-bg)',
          printing: 'var(--stage-production-bg)',
          post: 'var(--stage-review-bg)',
          payment: 'var(--stage-payment-bg)',
        },
        background: 'var(--bg-app)',
        foreground: 'var(--text-body)',
        border: 'var(--border-default)',
        input: 'var(--bg-input)',
        ring: 'var(--border-focus)',
        // ── Brand palette (legacy class support) ────────────────────────
        'brand-forest':  '#1C3A2A',
        'brand-sage':    '#4A7C5A',
        'brand-cream':   '#EBEBCF',
        'brand-border':  '#D8D4C0',
        'brand-muted':   '#9C9478',
        'brand-black':   '#1C1A14',
        'brand-danger':  '#EF4444',
        // ── Semantic aliases for dashboard cards ─────────────────────────
        navy: '#1C1A14',
        gold: '#C2A980',
      },
      backgroundImage: {
        'sidebar-gradient': 'var(--bg-sidebar)',
        'btn-primary': 'var(--btn-primary-bg)',
        'btn-primary-hover': 'var(--btn-primary-hover)',
        'btn-accent': 'var(--btn-accent-bg)',
        'btn-accent-hover': 'var(--btn-accent-hover)',
        'btn-danger': 'var(--btn-danger-bg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        syne: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
