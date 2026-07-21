// ── GLOBALS FOR OTHER MODULES ──
let cw, ch, lastTime = 0, prevVersion = -1;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const state = {
    tree: null, focusedId: null, mode: 'view',
    isEditing: false, isNoteOpen: false, isPanelOpen: false, isHelpOpen: false,
    isOverview: false, layoutDir: 'top-down', 
    targetZoom: 0.9,
    deletePending: null, deletePendingTime: 0,
    undoStack: [], redoStack: [], treeVersion: 0, animNodes: {},
    hoveredId: null, 
    isMobile: false,
    helpCloseBtn: null,
    panelView: 'none',
    panelHoverLock: false
};

// ── DEFAULT SAMPLE DATA (Arabic Philosophy) ──
const DEFAULT_SAMPLE = `1. الفلسفة والعلم
  : التقاطع العميق بين التفكير الفلسفي والمنهج العلمي التجريبي
  1. نظرية المعرفة
    : دراسة طبيعة المعرفة، مصادرها، وحدود اليقين البشري
    1. العقلانية
      : المعرفة الحقيقية تُستمد من العقل والاستدلال المنطقي الخالص
    2. التجريبية
      : المعرفة تنبع حصرياً من التجربة الحسية والملاحظة
      1. المنهج العلمي
        : الخطوات المنهجية المنظمة لاختبار الفرضيات واستكشاف الظواهر
        1. العلوم الطبيعية
          : الدراسة التجريبية المنهجية للظواهر الفيزيائية والبيولوجية
          1. الفيزياء الأساسية
            : البحث عن القوانين النهائية التي تحكم المادة والطاقة والزمان والمكان
            1. فيزياء الكم
              : دراسة سلوك الطاقة والمادة على المستوى الذري وتحت الذري
              1. التفسيرات الفلسفية للكم
                : المحاولات المختلفة لفهم ما تعنيه معادلات الكم واقعياً
                1. تفسير كوبنهاغن
                  : التفسير السائد الذي يؤكد على الدور الحاسم لعملية القياس
                  1. انهيار دالة الموجة
                    : الانتقال المفاجئ للنظام الكمي من تراكب احتمالي إلى حالة محددة
  2. الميتافيزيقا
    : دراسة الوجود بحد ذاته، وما وراء الطبيعة المادية الملموسة
    1. علم الوجود
      : تساؤلات جوهرية حول ماهية "الكينونة" و"اللاشيء"
    2. قضية الحرية والحتمية
      : هل الكون يسير بآلية ميكانيكية حتمية أم أن للإنسان إرادة حرة حقيقية؟
    3. فلسفة العقل والوعي
      : كيف يمكن لكتلة من الخلايا العصبية المادية أن تنتج تجربة ذاتية واعية؟
  3. الأخلاقيات وفلسفة القيم
    : البحث المنهجي عن المبادئ التي توجّه السلوك البشري الصحيح
    1. النفعية
      : الفعل الأخلاقي هو الذي يحقق أكبر قدر من السعادة لأكبر عدد من الناس
    2. أخلاقيات الواجب
      : الأخلاق تقوم على واجبات مطلقة يجب الالتزام بها بغض النظر عن النتائج
    3. أخلاقيات العلوم والتكنولوجيا
      : وضع حدود أخلاقية للتجارب العلمية والتطور التكنولوجي السريع
      1. أخلاقيات الذكاء الاصطناعي
        : التحديات المتعلقة بوضع قيادات ذكية غير بشرية موثوقة ومتوافقة مع قيمنا
  4. علم الجمال
    : التأمل الفلسفي في طبيعة الجمال، الفن، والذوق الإنساني
    1. النظريات الجمالية الكلاسيكية
      : الجمال يكمن في التناسب، الانسجام، والاكتمال`;

// ── THEME TOGGLING LOGIC ──
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

// ── COORDINATE MATH & HIT TESTING ──
function screenToWorld(sx, sy) {
    const z = state.targetZoom;
    return { x: (sx - cw/2) / z + cw/2, y: (sy - ch/2) / z + ch/2 };
}

function getNodeAtPos(wx, wy) {
    const ids = Object.keys(state.animNodes);
    for (let i = ids.length - 1; i >= 0; i--) {
        const id = ids[i];
        const a = state.animNodes[id];
        if (a.ta < 0.2) continue; 
        const dist = Math.hypot(wx - a.x, wy - a.y);
        if (dist <= a.r * 1.1) return id; 
    }
    return null;
}

// ── MOUSE INTERACTIONS ──
canvas.addEventListener('mousemove', (e) => {
    // FIX: Removed 'state.isEditing' block so hover tooltip works while in Edit mode
    if (state.isHelpOpen || state.isNoteOpen) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const {x: wx, y: wy} = screenToWorld(sx, sy);
    
    const hitId = getNodeAtPos(wx, wy);
    const newHoveredId = hitId !== state.focusedId ? hitId : null;
    
    if (state.hoveredId !== newHoveredId) {
        state.hoveredId = newHoveredId;
        canvas.style.cursor = newHoveredId ? 'pointer' : 'default';
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (state.isHelpOpen && state.helpCloseBtn) {
        const btn = state.helpCloseBtn;
        const dist = Math.hypot(sx - btn.x, sy - btn.y);
        if (dist <= btn.r) { state.isHelpOpen = false; return; }
    }

    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    
    const {x: wx, y: wy} = screenToWorld(sx, sy);
    const hitId = getNodeAtPos(wx, wy);
    
    if (hitId && hitId !== state.focusedId) {
        state.focusedId = hitId;
        state.deletePending = null;
        state.treeVersion++;
        updateNotePanel();
    }
});

canvas.addEventListener('mouseleave', () => {
    if (state.hoveredId) { state.hoveredId = null; canvas.style.cursor = 'default'; }
});

// ── TOUCH INTERACTIONS ──
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let initialPinchDist = null;

function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

canvas.addEventListener('touchstart', (e) => {
    if (state.isEditing || state.isHelpOpen) return;
    e.preventDefault(); 
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now();
    } else if (e.touches.length === 2) { initialPinchDist = getTouchDist(e.touches); }
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    if (state.isEditing || state.isHelpOpen) return;
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
            if (hitId && hitId !== state.focusedId) { state.focusedId = hitId; state.deletePending = null; state.treeVersion++; updateNotePanel(); }
        }
    }
    initialPinchDist = null;
});

// ── ZOOM (Mouse Wheel) ──
canvas.addEventListener('wheel', (e) => {
    if (state.isHelpOpen) return;
    e.preventDefault();
    state.targetZoom = clamp(state.targetZoom + (e.deltaY > 0 ? -0.04 : 0.04), 0.35, 1.8);
    if (!state.isOverview && state.targetZoom < CONFIG.zoomThreshold) { state.isOverview = true; state.treeVersion++; } 
    else if (state.isOverview && state.targetZoom >= CONFIG.zoomThreshold) { state.isOverview = false; state.treeVersion++; }
}, { passive: false });

// ── PANEL & UI LISTENERS ──
document.getElementById('panelToggle').addEventListener('mouseenter', () => {
    if (!state.isPanelOpen) { state.panelHoverLock = false; openMarkupPanel(); }
});

document.getElementById('panelToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    state.panelHoverLock = true; 
    if (state.isPanelOpen && state.panelView === 'markup') togglePanelUI();
    else openMarkupPanel();
});

document.getElementById('panel').addEventListener('mouseleave', () => {
    if (!state.panelHoverLock && !state.isNoteOpen) togglePanelUI();
});

document.getElementById('importBtn').addEventListener('click', () => {
    const text = document.getElementById('markupArea').value.trim();
    if (!text) return;
    pushSnapshot();
    state.tree = parseMarkup(text);
    state.focusedId = state.tree.id;
    state.treeVersion++; saveToStorage();
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const markup = serialize(state.tree);
    document.getElementById('markupArea').value = markup;
    navigator.clipboard?.writeText(markup);
});

document.getElementById('noteArea').addEventListener('input', (e) => {
    if (state.mode === 'edit') {
        const node = findNode(state.tree, state.focusedId);
        if (node) node.note = e.target.value;
    }
});

document.getElementById('helpBtn').addEventListener('click', (e) => {
    e.stopPropagation(); 
    state.isHelpOpen = !state.isHelpOpen;
});

const markupArea = document.getElementById('markupArea');
markupArea.addEventListener('focus', () => {
    if (!markupArea.value.trim()) markupArea.value = serialize(state.tree);
});

// ── MAIN RENDER LOOP ──
function render(timestamp) {
    const time = timestamp / 1000;
    lastTime = time;
    const realDt = 0.016; 

    if (prevVersion !== state.treeVersion) { recalculateLayout(); prevVersion = state.treeVersion; }

    for (const id in state.animNodes) {
        const a = state.animNodes[id];
        if (a.x === undefined) { a.x = a.tx; a.y = a.ty; }
        const speed = 1 - Math.exp(-CONFIG.lerpSpeed * realDt);
        a.x = lerp(a.x, a.tx, speed);
        a.y = lerp(a.y, a.ty, speed);
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw/2, ch/2);
    ctx.scale(state.targetZoom, state.targetZoom);
    ctx.translate(-cw/2, -ch/2);

    const grd = ctx.createRadialGradient(cw / 2, ch * 0.5, 0, cw / 2, ch * 0.5, ch * 0.6);
    grd.addColorStop(0, CONFIG.colors.bgGlow);
    grd.addColorStop(1, 'rgba(10, 15, 13, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, cw, ch);

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
            for (const sib of getSortedChildren(parentNode)) {
                drawBezier(parentNode.id, sib.id, CONFIG.colors.connectionParent, sib.id === state.focusedId ? 1.0 : 0.6);
            }
        }
        const focusedNode = findNode(state.tree, state.focusedId);
        if (focusedNode) {
            for (const child of getSortedChildren(focusedNode).slice(0, CONFIG.maxVisibleChildren)) {
                drawBezier(state.focusedId, child.id, CONFIG.colors.connection, 1.0);
            }
        }
    }

    drawNodes(time);
    drawNotePreview(time); // Hover tooltip
    drawDeleteConfirmation();
    ctx.restore();

    drawBottomBar(); // RESTORED: Bottom bar with VIEW/EDIT
    
    if (state.isHelpOpen) drawHelpOverlay();

    requestAnimationFrame(render);
}

// ── INIT ──
function init() {
    state.isMobile = window.innerWidth <= 768;
    const savedTree = loadFromStorage();
    if (!savedTree) { state.tree = parseMarkup(DEFAULT_SAMPLE); } else { state.tree = savedTree; }
    state.focusedId = state.tree.id;
    applySavedTheme();
    resizeCanvas();
    updateModeBadge();
    requestAnimationFrame(render);
}

init();