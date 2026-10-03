/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── VerifyChain Design Tokens ──────────────────────────────────────────
      // These mirror the PRD Section 3.1 palette. Every color is defined here
      // so that changing a brand color is a one-line change in this file.
      colors: {
        // Primary — deep government blue
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1A56DB', // ← main brand blue (PRD spec)
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Status colors — green/amber/red, always paired with text labels
        status: {
          valid: '#16A34A',       // green — valid/pass
          'valid-bg': '#DCFCE7',
          pending: '#D97706',     // amber — pending/review
          'pending-bg': '#FEF3C7',
          rejected: '#DC2626',    // red — rejected/revoked/fail
          'rejected-bg': '#FEE2E2',
        },
        // Neutral structure
        surface: '#F8F9FA',       // page background (PRD spec)
        'text-primary': '#1F2937', // body text (PRD spec)
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        // Inter — clean, Google-adjacent, freely available from Google Fonts.
        // Loaded in index.html via <link> so it works even without a build step.
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px', // PRD: 8-12px radius for cards
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
