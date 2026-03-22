import { SEMANTIC_COLORS } from './tokens.js';

/**
 * theme.js — TSS Theme System
 *
 * Generates CSS custom properties for semantic colors that auto-switch
 * between light and dark mode using `prefers-color-scheme`.
 * Also includes a base reset and system font stack.
 */

export function buildThemeCSS() {
  let lightVars = '';
  let darkVars = '';

  for (const [name, [light, dark]] of Object.entries(SEMANTIC_COLORS)) {
    lightVars += `  --tss-${name}: ${light};\n`;
    darkVars += `  --tss-${name}: ${dark};\n`;
  }

  return `
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, "Noto Sans", sans-serif,
               "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
               "Noto Color Emoji";
  line-height: 1.5;
}

body {
  line-height: inherit;
  background-color: var(--tss-base);
  color: var(--tss-body);
  transition: background-color 0.2s ease, color 0.2s ease;
}

:root {
${lightVars}}

@media (prefers-color-scheme: dark) {
  :root {
${darkVars}  }
}

html.dark {
${darkVars}}

html.light {
${lightVars}}

@keyframes tss-pulse {
  50% { opacity: 0.5; }
}

@keyframes tss-shimmer {
  100% { background-position: 200% 0; }
}

@keyframes tss-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes tss-ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes tss-bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}
`;
}
