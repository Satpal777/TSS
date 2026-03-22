import { buildThemeCSS } from './theme.js';
import { parseClass } from './parser.js';

/**
 * index.js — TSS Runtime Engine
 *
 * Auto-initializes on DOMContentLoaded
 */

const VERSION = '__TSS_VERSION__';

//#region State
let _themeStyle = null;
let _utilStyle = null;
const _cache = new Set();
let _pendingCSS = '';
let _rafScheduled = false;
//#endregion

//#region Initialization
function init() {
  _themeStyle = document.createElement('style');
  _themeStyle.id = 'tss-theme';
  _themeStyle.textContent = buildThemeCSS();
  document.head.appendChild(_themeStyle);

  _utilStyle = document.createElement('style');
  _utilStyle.id = 'tss-utilities';
  document.head.appendChild(_utilStyle);

  scanNode(document.body);
  flushPending();
  startObserver();
}
//#endregion

//#region Core Parsing & DOM Updates
function scanNode(root) {
  if (!root || !root.querySelectorAll) return;

  if (root.classList) {
    processClassList(root.classList);
  }

  const elements = root.querySelectorAll('*');
  for (let i = 0; i < elements.length; i++) {
    processClassList(elements[i].classList);
  }
}

function processClassList(classList) {
  for (let i = 0; i < classList.length; i++) {
    generateRule(classList[i]);
  }
}

function generateRule(className) {
  if (_cache.has(className)) return;
  _cache.add(className);

  const result = parseClass(className);
  if (!result) return;

  const { selector, rules } = result;

  let css = `${selector} {\n`;
  for (const [prop, val] of Object.entries(rules)) {
    css += `  ${prop}: ${val};\n`;
  }
  css += '}\n';

  _pendingCSS += css;

  if (!_rafScheduled) {
    _rafScheduled = true;
    requestAnimationFrame(flushPending);
  }
}

function flushPending() {
  if (_pendingCSS) {
    _utilStyle.textContent += _pendingCSS;
    _pendingCSS = '';
  }
  _rafScheduled = false;
}

function startObserver() {
  const observer = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'childList') {
        for (let j = 0; j < m.addedNodes.length; j++) {
          const node = m.addedNodes[j];
          if (node.nodeType === 1) scanNode(node);
        }
      } else if (m.type === 'attributes' && m.attributeName === 'class') {
        if (m.target.classList) processClassList(m.target.classList);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
}
//#endregion

//#region Utilities (Theme, API)
function toggleDark() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');

  if (isDark) {
    html.classList.remove('dark');
    html.classList.add('light');
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
  }

  try {
    localStorage.setItem('tss-theme', isDark ? 'light' : 'dark');
  } catch (e) { }

  return !isDark;
}

function restoreThemePreference() {
  try {
    const saved = localStorage.getItem('tss-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) { }
}

function refresh() {
  scanNode(document.body);
  flushPending();
}
//#endregion

//#region Auto-Init (Browser)
// Auto-init for CDN usage (browser environment only)
if (typeof document !== 'undefined') {
  restoreThemePreference();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
//#endregion

// Public API
export {
  VERSION as version,
  refresh,
  toggleDark,
  parseClass as parse,
};
//#endregion
