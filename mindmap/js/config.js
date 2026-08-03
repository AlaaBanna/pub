// Version: v3.2.0 | Updated: 2026-08-04 | Features: API_BASE same-origin routing
const API_BASE = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';

// ── CANVAS THEME PALETTES ──
const THEMES = {
    dark: {
      bg: '#1e1e1e',
      bgGlow: 'rgba(226, 183, 20, 0.04)',
      nodeFill: 'rgba(45, 45, 45, 0.85)',
      border: 'rgba(68, 68, 68, 0.7)',
      selectedBorder: '#e2b714',
      selectedGlow: 'rgba(226, 183, 20, 0.35)',
      parentBorder: 'rgba(68, 68, 68, 0.4)',
      siblingBorder: 'rgba(68, 68, 68, 0.4)',
      connection: 'rgba(226, 183, 20, 0.35)',
      connectionParent: 'rgba(226, 183, 20, 0.18)',
      connectionSibling: 'rgba(68, 68, 68, 0.25)',
      text: '#e0e0e0',
      textDim: '#888888',
      noteDot: '#e2b714',
      deleteBg: 'rgba(50, 16, 16, 0.95)',
      deleteBorder: 'rgba(200, 70, 70, 0.45)',
      deleteText: '#e0a0a0',
      helpBg: 'rgba(30, 30, 30, 0.95)',
      helpBorder: 'rgba(68, 68, 68, 0.5)',
      helpText: '#e0e0e0',
      helpKey: '#e2b714',
      barBg: 'rgba(30, 30, 30, 0.85)',
      barBorder: 'rgba(68, 68, 68, 0.3)',
      barText: 'rgba(160, 160, 160, 0.6)',
      orbitLine: 'rgba(226, 183, 20, 0.12)'
    },
    light: {
      bg: '#f4f4f4',
      bgGlow: 'rgba(194, 141, 0, 0.06)',
      nodeFill: 'rgba(232, 232, 232, 0.9)',
      border: 'rgba(204, 204, 204, 0.8)',
      selectedBorder: '#c28d00',
      selectedGlow: 'rgba(194, 141, 0, 0.22)',
      parentBorder: 'rgba(204, 204, 204, 0.5)',
      siblingBorder: 'rgba(204, 204, 204, 0.5)',
      connection: 'rgba(194, 141, 0, 0.4)',
      connectionParent: 'rgba(194, 141, 0, 0.2)',
      connectionSibling: 'rgba(204, 204, 204, 0.4)',
      text: '#404040',
      textDim: '#737373',
      noteDot: '#c28d00',
      deleteBg: 'rgba(255, 240, 240, 0.95)',
      deleteBorder: 'rgba(200, 70, 70, 0.4)',
      deleteText: '#a04040',
      helpBg: 'rgba(255, 255, 255, 0.95)',
      helpBorder: 'rgba(204, 204, 204, 0.6)',
      helpText: '#404040',
      helpKey: '#c28d00',
      barBg: 'rgba(255, 255, 255, 0.85)',
      barBorder: 'rgba(204, 204, 204, 0.4)',
      barText: 'rgba(80, 80, 80, 0.6)',
      orbitLine: 'rgba(194, 141, 0, 0.15)'
    }
};
  
  const CONFIG = {
      maxVisibleChildren: 10,
      zoomThreshold: 0.8,
      nodeRadius: { focused: 104, parent: 72, child: 80 },
      alive: { focus: 1.8, overview: 0.35, intensity: 1.0 },
      lerpSpeed: 10,
      layout: { focusVGap: 260, focusHGap: 280, ovVGap: 150, ovHGap: 170 },
      undoMaxStates: 200,
      colors: THEMES.dark, // Default starting theme
      font: "'Tajawal', 'DM Sans', 'Noto Sans Arabic', sans-serif",
      fontSize: { focused: 18, child: 14, parent: 14, ovFocused: 16, ovChild: 13, ovGrandchild: 11 }
  };