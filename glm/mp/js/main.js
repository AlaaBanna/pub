// ── GLOBALS ──
let cw, ch, lastTime = 0, prevVersion = -1;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const state = {
    tree: null, focusedId: null, mode: 'view',
    isEditing: false, isNoteOpen: false, isHelpOpen: false,
    isOverview: false, layoutDir: 'top-down', 
    targetZoom: 0.9, deletePending: null, deletePendingTime: 0,
    undoStack: [], redoStack: [], treeVersion: 0, animNodes: {},
    hoveredId: null, isMobile: false, helpCloseBtn: null,
    isContextOpen: false, isContextDisabled: false
};

// ── DEFAULT DATA ──
const DEFAULT_SAMPLE = "root";

// ── THEME ──
window.mfToggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    CONFIG.colors = isLight ? THEMES.light : THEMES.dark;
    document.getElementById('mfThemeBtn').innerHTML = isLight 
        ? '<i class="fa-solid fa-moon"></i>' 
        : '<i class="fa-solid fa-sun"></i>';
    state.treeVersion++;
    localStorage.setItem('mf_theme', isLight ? 'light' : 'dark');
};
function applySavedTheme() {
    const saved = localStorage.getItem('mf_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        CONFIG.colors = THEMES.light;
        document.getElementById('mfThemeBtn').innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// ── CANVAS SETUP ──
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cw = rect.width; ch = rect.height;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.isMobile = window.innerWidth <= 768;
    state.treeVersion++;
}
window.addEventListener('resize', resizeCanvas);

// ── COORDINATES & HIT TESTING ──
function screenToWorld(sx, sy) {
    const z = state.targetZoom;
    return { x: (sx - cw/2) / z + cw/2, y: (sy - ch/2) / z + ch/2 };
}
function getNodeAtPos(wx, wy) {
    const ids = Object.keys(state.animNodes);
    for (let i = ids.length - 1; i >= 0; i--) {
        const id = ids[i], a = state.animNodes[id];
        if (a.ta < 0.2) continue; 
        if (Math.hypot(wx - a.x, wy - a.y) <= a.r * 1.1) return id; 
    }
    return null;
}

// ── MOUSE ──
canvas.addEventListener('mousemove', (e) => {
    if (state.isHelpOpen) return;
    const rect = canvas.getBoundingClientRect();
    const {x: wx, y: wy} = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hitId = getNodeAtPos(wx, wy);
    const newHoveredId = hitId !== state.focusedId ? hitId : null;
    if (state.hoveredId !== newHoveredId) { state.hoveredId = newHoveredId; canvas.style.cursor = newHoveredId ? 'pointer' : 'default'; }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (state.isHelpOpen && state.helpCloseBtn) {
        if (Math.hypot(sx - state.helpCloseBtn.x, sy - state.helpCloseBtn.y) <= state.helpCloseBtn.r) { state.isHelpOpen = false; return; }
    }
    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    const {x: wx, y: wy} = screenToWorld(sx, sy);
    const hitId = getNodeAtPos(wx, wy);
    if (hitId && hitId !== state.focusedId) {
        state.focusedId = hitId; state.deletePending = null; state.treeVersion++;
    }
});

canvas.addEventListener('mouseleave', () => {
    if (state.hoveredId) { state.hoveredId = null; canvas.style.cursor = 'default'; }
});

// ── TOUCH ──
let touchStartX = 0, touchStartY = 0, touchStartTime = 0, initialPinchDist = null;
function getTouchDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }

canvas.addEventListener('touchstart', (e) => {
    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    e.preventDefault(); 
    if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now(); }
    else if (e.touches.length === 2) { initialPinchDist = getTouchDist(e.touches); }
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    e.preventDefault();
    if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
        const absDx = Math.abs(dx), absDy = Math.abs(dy), threshold = 50; 
        if (absDx > threshold || absDy > threshold) {
            const isBottomUp = state.layoutDir === 'bottom-up';
            if (absDx > absDy) { navigateSibling(dx > 0 ? -1 : 1); }
            else { ((isBottomUp && dy < -threshold) || (!isBottomUp && dy > threshold)) ? navigateChild() : navigateParent(); }
            touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
        }
    } else if (e.touches.length === 2 && initialPinchDist) {
        const currentDist = getTouchDist(e.touches);
        state.targetZoom = clamp(state.targetZoom + (currentDist - initialPinchDist) * 0.005, 0.35, 1.8);
        if (!state.isOverview && state.targetZoom < CONFIG.zoomThreshold) { state.isOverview = true; state.treeVersion++; } 
        else if (state.isOverview && state.targetZoom >= CONFIG.zoomThreshold) { state.isOverview = false; state.treeVersion++; }
        initialPinchDist = currentDist;
    }
}, {passive: false});

canvas.addEventListener('touchend', (e) => {
    if (state.isEditing || state.isHelpOpen) return;
    if (e.changedTouches.length === 1) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX), dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (dx < 15 && dy < 15 && Date.now() - touchStartTime < 300) {
            const rect = canvas.getBoundingClientRect();
            const {x: wx, y: wy} = screenToWorld(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
            const hitId = getNodeAtPos(wx, wy);
            if (hitId && hitId !== state.focusedId) { state.focusedId = hitId; state.deletePending = null; state.treeVersion++; }
        }
    }
    initialPinchDist = null;
});

// ── ZOOM ──
canvas.addEventListener('wheel', (e) => {
    if (state.isHelpOpen || state.isNoteOpen) return;
    e.preventDefault();
    state.targetZoom = clamp(state.targetZoom + (e.deltaY > 0 ? -0.04 : 0.04), 0.35, 1.8);
    if (!state.isOverview && state.targetZoom < CONFIG.zoomThreshold) { state.isOverview = true; state.treeVersion++; } 
    else if (state.isOverview && state.targetZoom >= CONFIG.zoomThreshold) { state.isOverview = false; state.treeVersion++; }
}, { passive: false });

document.getElementById('panelToggle').addEventListener('click', () => toggleContextBox());
document.getElementById('cbCopyBtn').addEventListener('click', copyMarkupFromPanel);
document.getElementById('cbRebuildBtn').addEventListener('click', rebuildFromMarkup);
document.getElementById('cbCloseBtn').addEventListener('click', closeContextBox);

document.getElementById('helpBtn').addEventListener('click', (e) => { e.stopPropagation(); state.isHelpOpen = !state.isHelpOpen; });

// ── RENDER LOOP ──
function render(timestamp) {
    const time = timestamp / 1000; lastTime = time; const realDt = 0.016; 
    if (prevVersion !== state.treeVersion) { recalculateLayout(); prevVersion = state.treeVersion; }
    for (const id in state.animNodes) {
        const a = state.animNodes[id];
        if (a.x === undefined) { a.x = a.tx; a.y = a.ty; }
        const speed = 1 - Math.exp(-CONFIG.lerpSpeed * realDt);
        a.x = lerp(a.x, a.tx, speed);
        a.y = lerp(a.y, a.ty, speed);
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = CONFIG.colors.bg; ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw/2, ch/2); ctx.scale(state.targetZoom, state.targetZoom); ctx.translate(-cw/2, -ch/2);
    const grd = ctx.createRadialGradient(cw / 2, ch * 0.5, 0, cw / 2, ch * 0.5, ch * 0.8);
    grd.addColorStop(0, CONFIG.colors.bgGlow); grd.addColorStop(1, 'rgba(10, 15, 13, 0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, cw, ch);

    if (state.isOverview) {
        const vis = new Set(Object.keys(state.animNodes));
        for (const id in state.animNodes) {
            const node = findNode(state.tree, id);
            if (!node) continue;
            for (const child of getSortedChildren(node)) { if (vis.has(child.id)) drawBezier(id, child.id, CONFIG.colors.connection, 0.5); }
        }
    } else {
        const parentNode = findParent(state.tree, state.focusedId, null);
        if (parentNode) {
            for (const sib of getSortedChildren(parentNode)) drawBezier(parentNode.id, sib.id, CONFIG.colors.connectionParent, sib.id === state.focusedId ? 1.0 : 0.6);
        }
        const focusedNode = findNode(state.tree, state.focusedId);
        if (focusedNode) {
            for (const child of getSortedChildren(focusedNode).slice(0, CONFIG.maxVisibleChildren)) drawBezier(state.focusedId, child.id, CONFIG.colors.connection, 1.0);
        }
    }

    drawNodes(time);
    drawDeleteConfirmation();
    ctx.restore();

    // Position the node input to track the editing node
    if (state.isEditing) {
        updateNodeInputPosition();
    }

    // Position the floating note to track the focused node
    if (state.isNoteOpen) {
        const fn = document.getElementById('floatingNote');
        const a = state.animNodes[state.focusedId];
        if (a) {
            const z = state.targetZoom;
            fn.style.left = ((a.x - cw/2) * z + cw/2 - fn.offsetWidth/2) + 'px';
            fn.style.top = ((a.y - ch/2) * z + ch/2 + a.r * z + 12) + 'px';
        }
    }

    if (state.isHelpOpen) drawHelpOverlay();
    requestAnimationFrame(render);
}

// ── INIT ──
function init() {
    state.isMobile = window.innerWidth <= 768;
    state.tree = loadFromStorage() || createNode('root');
    state.focusedId = state.tree.id;
    applySavedTheme(); resizeCanvas(); updateModeBadge(); requestAnimationFrame(render);
}
init();