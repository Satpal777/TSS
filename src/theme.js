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

  return `//#region TSS Theme — Auto Light/Dark
//#region Base Reset
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
//#endregion

//#region Light Mode (default)
:root {
${lightVars}}
//#endregion

//#region Dark Mode (auto via media query)
@media (prefers-color-scheme: dark) {
  :root {
${darkVars}  }
}
//#endregion

//#region Manual override: .dark on <html>
html.dark {
${darkVars}}

}
//#endregion

//#region Manual override: .light on <html>
html.light {
${lightVars}}
//#endregion
//#endregion
`;
}
