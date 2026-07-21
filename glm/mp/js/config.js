// ── CANVAS THEME PALETTES ──
const THEMES = {
    dark: {
      bg: '#0a0f0d',
      bgGlow: 'rgba(18, 40, 30, 0.25)',
      nodeFill: 'rgba(18, 38, 32, 0.85)',
      border: 'rgba(80, 120, 100, 0.38)',
      selectedBorder: 'rgba(100, 200, 150, 0.65)',
      selectedGlow: 'rgba(100, 200, 150, 0.2)',
      parentBorder: 'rgba(80, 120, 100, 0.16)',
      siblingBorder: 'rgba(80, 120, 100, 0.15)',
      connection: 'rgba(80, 120, 100, 0.28)',
      connectionParent: 'rgba(80, 120, 100, 0.12)',
      connectionSibling: 'rgba(80, 120, 100, 0.06)',
      text: '#e0e8e4',
      textDim: 'rgba(160, 190, 175, 0.45)',
      noteDot: 'rgba(100, 200, 150, 0.5)',
      deleteBg: 'rgba(50, 16, 16, 0.95)',
      deleteBorder: 'rgba(200, 70, 70, 0.45)',
      deleteText: '#e0a0a0',
      helpBg: 'rgba(8, 16, 12, 0.92)',
      helpBorder: 'rgba(80, 120, 100, 0.25)',
      helpText: '#b0c8ba',
      helpKey: 'rgba(100, 200, 150, 0.7)',
      barBg: 'rgba(8, 14, 11, 0.85)',
      barBorder: 'rgba(80, 120, 100, 0.15)',
      barText: 'rgba(140, 170, 155, 0.5)'
    },
    light: {
      bg: '#f0f4f2',
      bgGlow: 'rgba(200, 220, 210, 0.4)',
      nodeFill: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(40, 80, 65, 0.2)',
      selectedBorder: 'rgba(20, 120, 80, 0.7)',
      selectedGlow: 'rgba(20, 120, 80, 0.15)',
      parentBorder: 'rgba(40, 80, 65, 0.12)',
      siblingBorder: 'rgba(40, 80, 65, 0.1)',
      connection: 'rgba(40, 80, 65, 0.25)',
      connectionParent: 'rgba(40, 80, 65, 0.12)',
      connectionSibling: 'rgba(40, 80, 65, 0.06)',
      text: '#1a2a22',
      textDim: 'rgba(30, 60, 45, 0.5)',
      noteDot: 'rgba(20, 120, 80, 0.6)',
      deleteBg: 'rgba(255, 240, 240, 0.95)',
      deleteBorder: 'rgba(200, 70, 70, 0.4)',
      deleteText: '#a04040',
      helpBg: 'rgba(255, 255, 255, 0.95)',
      helpBorder: 'rgba(40, 80, 65, 0.15)',
      helpText: '#3a5a4a',
      helpKey: 'rgba(20, 120, 80, 0.8)',
      barBg: 'rgba(255, 255, 255, 0.85)',
      barBorder: 'rgba(40, 80, 65, 0.1)',
      barText: 'rgba(30, 80, 60, 0.5)'
    }
  };
  
  const CONFIG = {
      maxVisibleChildren: 8,
      zoomThreshold: 0.8,
      nodeRadius: { focused: 150, parent: 75, child: 95 },
      alive: { focus: 2.0, overview: 0.3, intensity: 1.0 },
      lerpSpeed: 10,
      layout: { focusVGap: 340, focusHGap: 330, ovVGap: 180, ovHGap: 160 },
      undoMaxStates: 200,
      colors: THEMES.dark, // Default starting theme
      font: "'DM Sans', 'Noto Sans Arabic', sans-serif",
      fontSize: { focused: 15, child: 13, parent: 12, ovFocused: 14, ovChild: 11, ovGrandchild: 10 }
  };