import {
  SPACING,
  PALETTE,
  SEMANTIC_COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_WIDTH,
  BORDER_RADIUS,
  MAX_WIDTH,
  SHADOWS,
  OPACITY,
  Z_INDEX
} from './tokens.js';

/**
 * parser.js — TSS Class Parser
 *
 * Pure function `parseClass(className)` → { selector, rules } | null
 */

//#region Core Parser
export function parseClass(className) {
  var cls = className.trim();
  if (!cls) return null;

  var variant = null;
  var raw = cls;

  if (cls.indexOf(':') !== -1) {
    var parts = cls.split(':');
    if (parts.length === 2 && parts[0] === 'hover') {
      variant = 'hover';
      raw = parts[1];
    }
  }

  var isNeg = raw.charAt(0) === '-';
  var finalRaw = isNeg ? raw.slice(1) : raw;

  var result =
    parseDisplay(finalRaw) ||
    parseSpacing(finalRaw, isNeg) ||
    parseTextSize(finalRaw) ||
    parseFontWeight(finalRaw) ||
    parseTextAlign(finalRaw) ||
    parseBgColor(finalRaw) ||
    parseTextColor(finalRaw) ||
    parseBorderWidth(finalRaw) ||
    parseBorderColor(finalRaw) ||
    parseBorderRadius(finalRaw) ||
    parseBorderStyle(finalRaw) ||
    parseFlex(finalRaw) ||
    parseGrid(finalRaw) ||
    parseGap(finalRaw) ||
    parseSizing(finalRaw, isNeg) ||
    parsePosition(finalRaw) ||
    parseInset(finalRaw, isNeg) ||
    parseZIndex(finalRaw) ||
    parseShadow(finalRaw) ||
    parseCursor(finalRaw) ||
    parseOverflow(finalRaw) ||
    parseOpacity(finalRaw) ||
    parseTransition(finalRaw) ||
    parseAnimation(finalRaw) ||
    parseMisc(finalRaw);

  if (!result) return null;

  var escaped = escapeSelector(className);
  var selector = '.' + escaped;
  if (variant === 'hover') selector += ':hover';

  return { selector: selector, rules: result };
}
//#endregion

//#region Utility Parsers

function parseDisplay(cls) {
  var map = {
    'block': 'block',
    'inline-block': 'inline-block',
    'inline': 'inline',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'hidden': 'none',
    'table': 'table',
    'table-row': 'table-row',
    'table-cell': 'table-cell',
    'contents': 'contents',
  };
  if (map[cls] !== undefined) {
    return { 'display': map[cls] };
  }
  return null;
}

function parseSpacing(cls, isNeg) {
  var spacingMap = {
    'p': ['padding'],
    'px': ['padding-left', 'padding-right'],
    'py': ['padding-top', 'padding-bottom'],
    'pt': ['padding-top'],
    'pr': ['padding-right'],
    'pb': ['padding-bottom'],
    'pl': ['padding-left'],
    'm': ['margin'],
    'mx': ['margin-left', 'margin-right'],
    'my': ['margin-top', 'margin-bottom'],
    'mt': ['margin-top'],
    'mr': ['margin-right'],
    'mb': ['margin-bottom'],
    'ml': ['margin-left'],
  };

  var match = cls.match(/^(px|py|pt|pr|pb|pl|mx|my|mt|mr|mb|ml|p|m)-(.+)$/);
  if (!match) return null;

  var prefix = match[1];
  var key = match[2];
  var props = spacingMap[prefix];
  if (!props) return null;

  if (key === 'auto') {
    if (prefix.charAt(0) !== 'm') return null;
    var d = {};
    for (var i = 0; i < props.length; i++) d[props[i]] = 'auto';
    return d;
  }

  var value = SPACING[key];
  if (value === undefined) return null;

  var final = (isNeg && value !== '0') ? '-' + value : value;
  var d = {};
  for (var i = 0; i < props.length; i++) d[props[i]] = final;
  return d;
}

function parseTextSize(cls) {
  var match = cls.match(/^text-(xs|sm|base|lg|xl|[2-9]xl)$/);
  if (!match) return null;
  var size = FONT_SIZE[match[1]];
  if (!size) return null;
  return { 'font-size': size[0], 'line-height': size[1] };
}

function parseFontWeight(cls) {
  var match = cls.match(/^font-(.+)$/);
  if (!match) return null;
  var weight = FONT_WEIGHT[match[1]];
  if (!weight) return null;
  return { 'font-weight': weight };
}

function parseTextAlign(cls) {
  var match = cls.match(/^text-(left|center|right|justify|start|end)$/);
  if (!match) return null;
  return { 'text-align': match[1] };
}

function parseBgColor(cls) {
  if (cls === 'bg-shimmer') {
    return {
      'background-image': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
      'background-size': '200% 100%'
    };
  }
  var match = cls.match(/^bg-(.+)$/);
  if (!match) return null;
  var value = resolveColor(match[1]);
  if (value === null) return null;
  return { 'background-color': value };
}

function parseTextColor(cls) {
  var sizeKeys = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
  var alignKeys = ['left', 'center', 'right', 'justify', 'start', 'end'];

  var match = cls.match(/^text-(.+)$/);
  if (!match) return null;

  var key = match[1];
  if (sizeKeys.indexOf(key) !== -1 || alignKeys.indexOf(key) !== -1) return null;

  var value = resolveColor(key);
  if (value === null) return null;
  return { 'color': value };
}

function parseBorderWidth(cls) {
  var sides = { t: 'top', r: 'right', b: 'bottom', l: 'left' };

  var sideMatch = cls.match(/^border-(t|r|b|l)(?:-(\d+))?$/);
  if (sideMatch) {
    var side = sides[sideMatch[1]];
    var w = sideMatch[2] || '';
    var value = BORDER_WIDTH[w];
    if (value === undefined) return null;
    return { ['border-' + side + '-width']: value };
  }

  var widthMatch = cls.match(/^border(?:-(\d+))?$/);
  if (widthMatch) {
    var w = widthMatch[1] || '';
    var value = BORDER_WIDTH[w];
    if (value === undefined) return null;
    var decl = { 'border-width': value };
    if (w === '' || w === undefined) {
      decl['border-style'] = 'solid';
      decl['border-color'] = 'var(--tss-outline)';
    }
    return decl;
  }

  return null;
}

function parseBorderStyle(cls) {
  var styles = ['solid', 'dashed', 'dotted', 'double', 'none'];
  var match = cls.match(/^border-(solid|dashed|dotted|double|none)$/);
  if (!match) return null;
  return { 'border-style': match[1] };
}

function parseBorderColor(cls) {
  var match = cls.match(/^border-((?!t$|r$|b$|l$|none$|\d+$|solid$|dashed$|dotted$|double$).+)$/);
  if (!match) return null;
  var key = match[1];
  if (/^[trbl]-/.test(key)) return null;
  var value = resolveColor(key);
  if (value === null) return null;
  return { 'border-color': value };
}

function parseBorderRadius(cls) {
  var sideMatch = cls.match(/^rounded-(t|b|l|r|tl|tr|bl|br)(?:-(.+))?$/);
  if (sideMatch) {
    var sideKey = sideMatch[1];
    var sizeKey = sideMatch[2] || '';
    var value = BORDER_RADIUS[sizeKey];
    if (value === undefined) return null;
    var cornerMap = {
      't': ['border-top-left-radius', 'border-top-right-radius'],
      'b': ['border-bottom-left-radius', 'border-bottom-right-radius'],
      'l': ['border-top-left-radius', 'border-bottom-left-radius'],
      'r': ['border-top-right-radius', 'border-bottom-right-radius'],
      'tl': ['border-top-left-radius'],
      'tr': ['border-top-right-radius'],
      'bl': ['border-bottom-left-radius'],
      'br': ['border-bottom-right-radius'],
    };
    var corners = cornerMap[sideKey];
    if (!corners) return null;
    var decl = {};
    for (var i = 0; i < corners.length; i++) decl[corners[i]] = value;
    return decl;
  }

  var match = cls.match(/^rounded(?:-(.+))?$/);
  if (!match) return null;
  var key = match[1] || '';
  var value = BORDER_RADIUS[key];
  if (value === undefined) return null;
  return { 'border-radius': value };
}

function parseFlex(cls) {
  var map = {
    'flex-row': { 'flex-direction': 'row' },
    'flex-row-reverse': { 'flex-direction': 'row-reverse' },
    'flex-col': { 'flex-direction': 'column' },
    'flex-col-reverse': { 'flex-direction': 'column-reverse' },
    'flex-wrap': { 'flex-wrap': 'wrap' },
    'flex-wrap-reverse': { 'flex-wrap': 'wrap-reverse' },
    'flex-nowrap': { 'flex-wrap': 'nowrap' },
    'flex-1': { 'flex': '1 1 0%' },
    'flex-auto': { 'flex': '1 1 auto' },
    'flex-initial': { 'flex': '0 1 auto' },
    'flex-none': { 'flex': 'none' },
    'flex-grow': { 'flex-grow': '1' },
    'flex-grow-0': { 'flex-grow': '0' },
    'flex-shrink': { 'flex-shrink': '1' },
    'flex-shrink-0': { 'flex-shrink': '0' },

    'items-start': { 'align-items': 'flex-start' },
    'items-end': { 'align-items': 'flex-end' },
    'items-center': { 'align-items': 'center' },
    'items-baseline': { 'align-items': 'baseline' },
    'items-stretch': { 'align-items': 'stretch' },

    'justify-start': { 'justify-content': 'flex-start' },
    'justify-end': { 'justify-content': 'flex-end' },
    'justify-center': { 'justify-content': 'center' },
    'justify-between': { 'justify-content': 'space-between' },
    'justify-around': { 'justify-content': 'space-around' },
    'justify-evenly': { 'justify-content': 'space-evenly' },

    'self-auto': { 'align-self': 'auto' },
    'self-start': { 'align-self': 'flex-start' },
    'self-end': { 'align-self': 'flex-end' },
    'self-center': { 'align-self': 'center' },
    'self-stretch': { 'align-self': 'stretch' },
    'self-baseline': { 'align-self': 'baseline' },
  };

  return map[cls] || null;
}

function parseGrid(cls) {
  var colsMatch = cls.match(/^grid-cols-(\d+|none)$/);
  if (colsMatch) {
    var n = colsMatch[1];
    if (n === 'none') return { 'grid-template-columns': 'none' };
    return { 'grid-template-columns': 'repeat(' + n + ', minmax(0, 1fr))' };
  }

  var rowsMatch = cls.match(/^grid-rows-(\d+|none)$/);
  if (rowsMatch) {
    var n = rowsMatch[1];
    if (n === 'none') return { 'grid-template-rows': 'none' };
    return { 'grid-template-rows': 'repeat(' + n + ', minmax(0, 1fr))' };
  }

  var colSpanMatch = cls.match(/^col-span-(\d+|full)$/);
  if (colSpanMatch) {
    var n = colSpanMatch[1];
    if (n === 'full') return { 'grid-column': '1 / -1' };
    return { 'grid-column': 'span ' + n + ' / span ' + n };
  }

  var rowSpanMatch = cls.match(/^row-span-(\d+|full)$/);
  if (rowSpanMatch) {
    var n = rowSpanMatch[1];
    if (n === 'full') return { 'grid-row': '1 / -1' };
    return { 'grid-row': 'span ' + n + ' / span ' + n };
  }

  var placeMap = {
    'place-items-start': { 'place-items': 'start' },
    'place-items-end': { 'place-items': 'end' },
    'place-items-center': { 'place-items': 'center' },
    'place-items-stretch': { 'place-items': 'stretch' },
    'place-content-start': { 'place-content': 'start' },
    'place-content-end': { 'place-content': 'end' },
    'place-content-center': { 'place-content': 'center' },
    'place-content-between': { 'place-content': 'space-between' },
    'place-content-around': { 'place-content': 'space-around' },
    'place-content-evenly': { 'place-content': 'space-evenly' },
    'place-content-stretch': { 'place-content': 'stretch' },
  };

  return placeMap[cls] || null;
}

function parseGap(cls) {
  var match = cls.match(/^(gap|gap-x|gap-y)-(.+)$/);
  if (!match) return null;
  var prefix = match[1];
  var key = match[2];
  var value = SPACING[key];
  if (value === undefined) return null;

  if (prefix === 'gap') return { 'gap': value };
  if (prefix === 'gap-x') return { 'column-gap': value };
  if (prefix === 'gap-y') return { 'row-gap': value };
  return null;
}

function parseSizing(cls, isNeg) {
  var maxWMatch = cls.match(/^max-w-(.+)$/);
  if (maxWMatch) {
    var val = MAX_WIDTH[maxWMatch[1]];
    if (val !== undefined) return { 'max-width': val };
  }

  var minMaxMatch = cls.match(/^(min-w|min-h|max-h)-(.+)$/);
  if (minMaxMatch) {
    var prop = minMaxMatch[1].replace('-', '-');
    var key = minMaxMatch[2];
    var propMap = { 'min-w': 'min-width', 'min-h': 'min-height', 'max-h': 'max-height' };
    var cssProp = propMap[prop];
    if (!cssProp) return null;
    var value = SPACING[key];
    if (value === undefined) return null;
    return { [cssProp]: value };
  }

  var whMatch = cls.match(/^(w|h)-(.+)$/);
  if (whMatch) {
    var prefix = whMatch[1];
    var key = whMatch[2];
    var cssProp = prefix === 'w' ? 'width' : 'height';

    var fracMatch = key.match(/^(\d+)\/(\d+)$/);
    if (fracMatch) {
      var pct = (Number(fracMatch[1]) / Number(fracMatch[2]) * 100).toFixed(6).replace(/\.?0+$/, '') + '%';
      return { [cssProp]: pct };
    }

    var value = SPACING[key];
    if (value !== undefined) return { [cssProp]: value };
  }

  var sizeMatch = cls.match(/^size-(.+)$/);
  if (sizeMatch) {
    var key = sizeMatch[1];
    var fracMatch = key.match(/^(\d+)\/(\d+)$/);
    if (fracMatch) {
      var pct = (Number(fracMatch[1]) / Number(fracMatch[2]) * 100).toFixed(6).replace(/\.?0+$/, '') + '%';
      return { 'width': pct, 'height': pct };
    }
    var value = SPACING[key];
    if (value !== undefined) return { 'width': value, 'height': value };
  }

  return null;
}

function parsePosition(cls) {
  var map = {
    'static': 'static',
    'fixed': 'fixed',
    'absolute': 'absolute',
    'relative': 'relative',
    'sticky': 'sticky',
  };
  if (map[cls]) return { 'position': map[cls] };
  return null;
}

function parseInset(cls, isNeg) {
  var insetMap = {
    'inset': ['top', 'right', 'bottom', 'left'],
    'inset-x': ['left', 'right'],
    'inset-y': ['top', 'bottom'],
    'top': ['top'],
    'right': ['right'],
    'bottom': ['bottom'],
    'left': ['left'],
  };

  var match = cls.match(/^(inset-x|inset-y|inset|top|right|bottom|left)-(.+)$/);
  if (!match) return null;

  var prefix = match[1];
  var key = match[2];
  var props = insetMap[prefix];
  if (!props) return null;

  var value = SPACING[key];
  if (value === undefined) return null;

  var final = (isNeg && value !== '0') ? '-' + value : value;
  var d = {};
  for (var i = 0; i < props.length; i++) d[props[i]] = final;
  return d;
}

function parseZIndex(cls) {
  var match = cls.match(/^z-(.+)$/);
  if (!match) return null;
  var value = Z_INDEX[match[1]];
  if (value === undefined) return null;
  return { 'z-index': value };
}

function parseShadow(cls) {
  var match = cls.match(/^shadow(?:-(.+))?$/);
  if (!match) return null;
  var key = match[1] || '';
  var value = SHADOWS[key];
  if (value === undefined) return null;
  return { 'box-shadow': value };
}

function parseCursor(cls) {
  var cursors = [
    'auto', 'default', 'pointer', 'wait', 'text', 'move', 'help',
    'not-allowed', 'none', 'context-menu', 'progress', 'cell',
    'crosshair', 'vertical-text', 'alias', 'copy', 'no-drop',
    'grab', 'grabbing', 'col-resize', 'row-resize', 'zoom-in', 'zoom-out'
  ];
  var match = cls.match(/^cursor-(.+)$/);
  if (!match) return null;
  if (cursors.indexOf(match[1]) !== -1) {
    return { 'cursor': match[1] };
  }
  return null;
}

function parseOverflow(cls) {
  var values = ['auto', 'hidden', 'clip', 'visible', 'scroll'];
  var match = cls.match(/^overflow-(x-|y-)?(.+)$/);
  if (!match) return null;
  var axis = match[1] ? match[1].replace('-', '') : null;
  var val = match[2];
  if (values.indexOf(val) === -1) return null;

  if (axis === 'x') return { 'overflow-x': val };
  if (axis === 'y') return { 'overflow-y': val };
  return { 'overflow': val };
}

function parseOpacity(cls) {
  var match = cls.match(/^opacity-(.+)$/);
  if (!match) return null;
  var value = OPACITY[match[1]];
  if (value === undefined) return null;
  return { 'opacity': value };
}

function parseTransition(cls) {
  var map = {
    'transition': { 'transition-property': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-all': { 'transition-property': 'all', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-colors': { 'transition-property': 'color, background-color, border-color, text-decoration-color, fill, stroke', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-opacity': { 'transition-property': 'opacity', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-shadow': { 'transition-property': 'box-shadow', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-transform': { 'transition-property': 'transform', 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)', 'transition-duration': '150ms' },
    'transition-none': { 'transition-property': 'none' },
  };

  var durMatch = cls.match(/^duration-(\d+)$/);
  if (durMatch) return { 'transition-duration': durMatch[1] + 'ms' };

  var easeMap = {
    'ease-linear': { 'transition-timing-function': 'linear' },
    'ease-in': { 'transition-timing-function': 'cubic-bezier(0.4, 0, 1, 1)' },
    'ease-out': { 'transition-timing-function': 'cubic-bezier(0, 0, 0.2, 1)' },
    'ease-in-out': { 'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)' },
  };

  return map[cls] || easeMap[cls] || null;
}

function parseAnimation(cls) {
  var map = {
    'animate-none': { 'animation': 'none' },
    'animate-spin': { 'animation': 'tss-spin 1s linear infinite' },
    'animate-ping': { 'animation': 'tss-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
    'animate-pulse': { 'animation': 'tss-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
    'animate-bounce': { 'animation': 'tss-bounce 1s infinite' },
    'animate-shimmer': { 'animation': 'tss-shimmer 2s infinite linear' },
  };

  return map[cls] || null;
}

function parseMisc(cls) {
  var map = {
    'select-none': { 'user-select': 'none' },
    'select-text': { 'user-select': 'text' },
    'select-all': { 'user-select': 'all' },
    'select-auto': { 'user-select': 'auto' },
    'outline-none': { 'outline': '2px solid transparent', 'outline-offset': '2px' },
    'outline': { 'outline-style': 'solid' },
    'appearance-none': { 'appearance': 'none' },
    'list-none': { 'list-style-type': 'none' },
    'list-disc': { 'list-style-type': 'disc' },
    'list-decimal': { 'list-style-type': 'decimal' },
    'truncate': { 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' },
    'whitespace-nowrap': { 'white-space': 'nowrap' },
    'whitespace-normal': { 'white-space': 'normal' },
    'whitespace-pre': { 'white-space': 'pre' },
    'whitespace-pre-wrap': { 'white-space': 'pre-wrap' },
    'break-words': { 'overflow-wrap': 'break-word' },
    'break-all': { 'word-break': 'break-all' },
    'break-normal': { 'overflow-wrap': 'normal', 'word-break': 'normal' },
    'underline': { 'text-decoration-line': 'underline' },
    'overline': { 'text-decoration-line': 'overline' },
    'line-through': { 'text-decoration-line': 'line-through' },
    'no-underline': { 'text-decoration-line': 'none' },
    'uppercase': { 'text-transform': 'uppercase' },
    'lowercase': { 'text-transform': 'lowercase' },
    'capitalize': { 'text-transform': 'capitalize' },
    'normal-case': { 'text-transform': 'none' },
    'italic': { 'font-style': 'italic' },
    'not-italic': { 'font-style': 'normal' },
    'antialiased': { '-webkit-font-smoothing': 'antialiased', '-moz-osx-font-smoothing': 'grayscale' },
    'pointer-events-none': { 'pointer-events': 'none' },
    'pointer-events-auto': { 'pointer-events': 'auto' },
    'resize-none': { 'resize': 'none' },
    'resize': { 'resize': 'both' },
    'resize-x': { 'resize': 'horizontal' },
    'resize-y': { 'resize': 'vertical' },
    'border-collapse': { 'border-collapse': 'collapse' },
    'border-separate': { 'border-collapse': 'separate' },
    'object-cover': { 'object-fit': 'cover' },
    'object-contain': { 'object-fit': 'contain' },
    'object-fill': { 'object-fit': 'fill' },
    'object-none': { 'object-fit': 'none' },
    'sr-only': { 'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0', 'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'white-space': 'nowrap', 'border-width': '0' },
    'not-sr-only': { 'position': 'static', 'width': 'auto', 'height': 'auto', 'padding': '0', 'margin': '0', 'overflow': 'visible', 'clip': 'auto', 'white-space': 'normal' },
  };

  return map[cls] || null;
}
//#endregion

//#region Helpers
function resolveColor(key) {
  if (SEMANTIC_COLORS[key]) return 'var(--tss-' + key + ')';
  if (key === 'white') return PALETTE.white;
  if (key === 'black') return PALETTE.black;
  if (key === 'transparent') return 'transparent';
  if (key === 'inherit') return 'inherit';
  if (key === 'current') return 'currentColor';

  var shadeMatch = key.match(/^([a-z]+)-(\d+)$/);
  if (shadeMatch) {
    var pal = PALETTE[shadeMatch[1]];
    if (pal && pal[Number(shadeMatch[2])] !== undefined) {
      return pal[Number(shadeMatch[2])];
    }
  }
  return null;
}

function escapeSelector(str) {
  return str.replace(/([.:#\[\]()>+~=!@$%^&*,{}'"/\\])/g, '\\$1');
}
//#endregion
