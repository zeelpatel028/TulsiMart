// Centralized Deep Teal & Mint Theme Color System for TulsiMart

export const THEME_COLORS = {
  // Brand Primary & Accents
  deepTeal: '#00695C',      // Main brand color, primary buttons, important CTAs, active navigation, headers
  teal: '#009688',          // Accents, links, icons, hover states, selected states, interactive elements
  mintGreen: '#4DB6AC',     // Secondary elements, supporting icons, decorative elements, secondary actions
  lightMint: '#E0F2F1',     // Category backgrounds, promotional sections, search backgrounds, selected states, soft UI surfaces
  veryLightMint: '#F0FAF9', // Main application/website background
  
  // Base Neutral Surface & Text
  white: '#FFFFFF',         // Cards, product containers, navigation surfaces, modals, forms, clean content areas
  darkCharcoal: '#263238',  // Headings, product names, navigation text, primary text
  slateGray: '#607D8B',     // Descriptions, secondary text, metadata, placeholders
  
  // Status & Highlights
  gold: '#FBC02D',          // Offers, discounts, special deals, promotional badges, ratings/highlights ONLY
  errorRed: '#E53935',      // Errors, validation messages, delete/remove actions, failed states, destructive actions
  borderMint: '#B2DFDB',    // Soft input and card borders
  focusRing: 'rgba(0, 150, 136, 0.25)', // Teal focus ring

  // Pre-configured CSS classes mapping for convenience
  classes: {
    bgPage: 'bg-[#F0FAF9] dark:bg-slate-950',
    bgCard: 'bg-white dark:bg-slate-900',
    bgSection: 'bg-[#E0F2F1] dark:bg-slate-800',
    textHead: 'text-[#263238] dark:text-slate-100',
    textBody: 'text-[#263238] dark:text-slate-200',
    textMuted: 'text-[#607D8B] dark:text-slate-400',
    textBrand: 'text-[#00695C] dark:text-[#4DB6AC]',
    border: 'border-[#B2DFDB] dark:border-slate-800',
    btnPrimary: 'bg-[#00695C] hover:bg-[#004D40] text-white',
    btnAccent: 'bg-[#009688] hover:bg-[#00695C] text-white',
    btnSecondary: 'bg-[#4DB6AC] hover:bg-[#009688] text-white',
    btnLight: 'bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#00695C]',
    btnDanger: 'bg-[#E53935] hover:bg-[#c62828] text-white',
  }
};

export default THEME_COLORS;
