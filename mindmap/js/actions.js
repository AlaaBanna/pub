// Version: v3.2.2 | Updated: 2026-07-31 17:09 | Features: Detailed error message propagation from backend server
let editingId = null;

// ── UNDO / REDO ──
function pushSnapshot() {
    state.undoStack.push({ t: clone(state.tree), f: state.focusedId });
    if (state.undoStack.length > CONFIG.undoMaxStates) state.undoStack.shift();
    state.redoStack = [];
    saveToStorage();
}

function toggleCompletionAction() {
    if (state.isEditing || state.isReadOnly) return;
    if (!state.focusedId) return;
    pushSnapshot();
    toggleNodeCompletion(state.tree, state.focusedId);
    state.treeVersion++;
    saveToStorage();
}

function undo() {
    if (!state.undoStack.length || state.isEditing || state.isNoteOpen) return;
    state.redoStack.push({ t: clone(state.tree), f: state.focusedId });
    const s = state.undoStack.pop();
    state.tree = s.t; state.focusedId = s.f;
    state.deletePending = null; state.treeVersion++; saveToStorage();
}

function redo() {
    if (!state.redoStack.length || state.isEditing || state.isNoteOpen) return;
    state.undoStack.push({ t: clone(state.tree), f: state.focusedId });
    const s = state.redoStack.pop();
    state.tree = s.t; state.focusedId = s.f;
    state.deletePending = null; state.treeVersion++; saveToStorage();
}

function updateNodeInputPosition() {
    if (!state.isEditing || !editingId) return;
    const inp = document.getElementById('nodeInput');
    const a = state.animNodes[editingId];
    if (a) {
        const z = state.targetZoom;
        const screenX = (a.x - cw/2) * z + cw/2;
        const screenY = (a.y - ch/2) * z + ch/2;
        inp.style.left = (screenX - 90) + 'px';
        inp.style.top = (screenY - 18) + 'px';
        inp.style.width = Math.max(160, Math.min(320, a.r * 1.6 * z + 40)) + 'px';
    }
}

function showNodeInput(id) {
    const node = findNode(state.tree, id);
    if (!node) return;
    const inp = document.getElementById('nodeInput');
    editingId = id; state.isEditing = true;
    inp.value = node.text; inp.style.display = 'block';
    updateNodeInputPosition();
    inp.focus(); inp.select();
}

function hideNodeInput(save = true) {
    if (!state.isEditing) return;
    const inp = document.getElementById('nodeInput');
    if (save && editingId) {
        const node = findNode(state.tree, editingId);
        if (node && node.text !== inp.value) {
            pushSnapshot();
            node.text = inp.value;
            state.treeVersion++;
            saveToStorage();
        }
    }
    inp.style.display = 'none'; inp.blur();
    state.isEditing = false; editingId = null;
}

function startEditing() {
    if (state.isOverview) return;
    showNodeInput(state.focusedId);
}

function createChild() {
    if (state.isOverview) return;
    pushSnapshot();
    const focusedNode = findNode(state.tree, state.focusedId);
    if (!focusedNode) return;
    const newChild = createNode('', focusedNode.children.length);
    focusedNode.children.push(newChild);
    state.focusedId = newChild.id;
    state.treeVersion++;
    showNodeInput(newChild.id);
}

function createSibling() {
    if (state.isOverview) return;
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) {
        createChild();
        return;
    }
    pushSnapshot();
    const sorted = getSortedChildren(parent);
    const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(c => c.order)) : 0;
    const newSibling = createNode('', maxOrder + 1);
    parent.children.push(newSibling);
    state.focusedId = newSibling.id;
    state.treeVersion++;
    showNodeInput(newSibling.id);
}

function newMap() {
    pushSnapshot();
    state.tree = createNode('root');
    state.focusedId = state.tree.id;
    state.treeVersion++; saveToStorage();
    closeFloatingNote();
}

function confirmEditAndCreateChild() { hideNodeInput(true); createChild(); }
function cancelEdit() { hideNodeInput(false); }

// ── NAVIGATION ──
function navigateChild() {
    const node = findNode(state.tree, state.focusedId);
    if (!node || node.children.length === 0) return;
    const sorted = getSortedChildren(node);
    state.focusedId = sorted[0].id;
    state.deletePending = null; state.treeVersion++; closeFloatingNote();
}

function navigateParent() {
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) return;
    state.focusedId = parent.id;
    state.deletePending = null; state.treeVersion++; closeFloatingNote();
}

function navigateSibling(dir) { 
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) return;
    const sorted = getSortedChildren(parent);
    const idx = sorted.findIndex(c => c.id === state.focusedId);
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < sorted.length) {
        state.focusedId = sorted[nextIdx].id;
        state.deletePending = null; state.treeVersion++; closeFloatingNote();
    }
}

// ── DELETE ──
function handleDelete(isShift) {
    if (state.isOverview) return;
    if (state.deletePending === state.focusedId && isShift) { pushSnapshot(); executeDelete(); return; }
    const node = findNode(state.tree, state.focusedId);
    const count = getDescendantCount(node);
    if (count === 0) { pushSnapshot(); executeDelete(); } 
    else { state.deletePending = state.focusedId; state.deletePendingTime = performance.now(); }
}

function executeDelete() {
    state.deletePending = null;
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) { state.tree = createNode('root'); state.focusedId = state.tree.id; } 
    else {
        const idx = parent.children.findIndex(c => c.id === state.focusedId);
        parent.children.splice(idx, 1);
        const sorted = getSortedChildren(parent);
        state.focusedId = sorted.length > 0 ? sorted[Math.min(idx, sorted.length - 1)].id : parent.id;
    }
    state.treeVersion++; saveToStorage();
}

function reorderNode(dir) { 
    if (state.isOverview) return;
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) return;
    const sorted = getSortedChildren(parent);
    const idx = sorted.findIndex(c => c.id === state.focusedId);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    pushSnapshot();
    const tempOrder = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = tempOrder;
    state.treeVersion++; saveToStorage();
}

// ── MODES & UI ──

function resetView() {
    state.targetZoom = 1.0; 
    state.isOverview = false; state.treeVersion++;
}

function toggleLayout() {
    state.layoutDir = state.layoutDir === 'top-down' ? 'bottom-up' : 'top-down';
    state.treeVersion++;
}

// ── CONTEXT BOX ──
// ── CONTEXT BOX ──
function toggleContextBox(forceOpen = false) {
    if (forceOpen && !state.isContextOpen) state.isContextOpen = true;
    else if (!forceOpen) state.isContextOpen = !state.isContextOpen;

    const cb = document.getElementById('contextBox');
    if (cb) cb.classList.toggle('open', state.isContextOpen);
}

function closeContextBox() {
    state.isContextOpen = false;
    document.getElementById('contextBox').classList.remove('open');
    document.getElementById('panelToggle').classList.remove('open');
    if (state.tree) {
        state.focusedId = state.tree.id;
        state.treeVersion++;
    }
}

function loadSampleData() {
    pushSnapshot();
    state.tree = parseMarkup(DEFAULT_SAMPLE_MARKUP);
    state.focusedId = state.tree.id;
    state.treeVersion++;
    saveToStorage();
}

// ── SEARCH & SHORTEST-PATH CONNECTOR HIGHLIGHTS ──
function clearSearch() {
    state.searchTitleMatchIds = null;
    state.searchNoteMatchIds = null;
    state.searchMatchIds = null;
    state.searchMatchList = null;
    state.searchMatchIndex = -1;
    state.searchPathEdges = null;
    state.isOverview = false;
    state.targetZoom = 1.0;
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    const countEl = document.getElementById('searchResultCount');
    if (countEl) countEl.textContent = '';
    state.treeVersion++;
}

function performSearch(query) {
    if (!query || !query.trim()) {
        clearSearch();
        return;
    }

    const rawTerms = query.split(/[,;\n،\u060C]+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    if (rawTerms.length === 0) { clearSearch(); return; }

    const titleMatches = [];
    const noteMatches = [];

    function searchNode(node) {
        if (!node) return;
        const textLower = (node.text || '').toLowerCase();
        const noteLower = (node.note || '').toLowerCase();
        
        const isTitle = rawTerms.some(term => textLower.includes(term));
        const isNote = !isTitle && rawTerms.some(term => noteLower.includes(term));

        if (isTitle) titleMatches.push(node);
        else if (isNote) noteMatches.push(node);

        if (node.children) node.children.forEach(searchNode);
    }
    searchNode(state.tree);

    const allMatches = [...titleMatches, ...noteMatches];
    const countEl = document.getElementById('searchResultCount');
    if (countEl) countEl.textContent = allMatches.length > 0 ? `${allMatches.length} match${allMatches.length > 1 ? 'es' : ''}` : 'No matches';

    if (allMatches.length === 0) {
        state.searchTitleMatchIds = new Set();
        state.searchNoteMatchIds = new Set();
        state.searchMatchIds = new Set();
        state.searchPathEdges = new Set();
        state.treeVersion++;
        return;
    }

    state.searchTitleMatchIds = new Set(titleMatches.map(m => m.id));
    state.searchNoteMatchIds = new Set(noteMatches.map(m => m.id));
    state.searchMatchIds = new Set(allMatches.map(m => m.id));
    state.searchMatchList = allMatches.map(m => m.id);
    state.searchMatchIndex = 0;
    state.searchPathEdges = new Set();

    if (allMatches.length > 0) {
        state.focusedId = allMatches[0].id;
    }

    if (allMatches.length === 1) {
        state.treeVersion++;
        return;
    }

    for (let i = 0; i < allMatches.length; i++) {
        for (let j = i + 1; j < allMatches.length; j++) {
            tracePathBetweenNodes(allMatches[i].id, allMatches[j].id);
        }
    }

    state.isOverview = true;
    state.targetZoom = 0.75;
    state.treeVersion++;
}

function tracePathBetweenNodes(id1, id2) {
    const path1 = getAncestorsPath(id1);
    const path2 = getAncestorsPath(id2);
    if (!path1.length || !path2.length) return;

    let i = 0;
    while (i < path1.length && i < path2.length && path1[i].id === path2[i].id) {
        i++;
    }

    for (let idx = path1.length - 1; idx >= i; idx--) {
        const child = path1[idx];
        const parent = path1[idx - 1];
        if (parent && child) state.searchPathEdges.add(`${parent.id}-${child.id}`);
    }

    for (let idx = path2.length - 1; idx >= i; idx--) {
        const child = path2[idx];
        const parent = path2[idx - 1];
        if (parent && child) state.searchPathEdges.add(`${parent.id}-${child.id}`);
    }
}

function getAncestorsPath(nodeId) {
    const path = [];
    let currId = nodeId;
    while (currId) {
        const node = findNode(state.tree, currId);
        if (!node) break;
        path.unshift(node);
        const parent = findParent(state.tree, currId, null);
        currId = parent ? parent.id : null;
    }
    return path;
}

// ── TIMESTAMP HELPER ──
function getFormattedTimestamp() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    return `${dateStr}_${timeStr}`;
}

// ── CUSTOM .MT FILE EXPORT & IMPORT ──
function exportAsMT() {
    try {
        if (!state.tree) return;
        const mtContent = serializeMT(state.tree);
        const titleText = (state.tree && state.tree.text ? state.tree.text.trim() : 'mindmap').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
        const blob = new Blob([mtContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `${titleText}_${getFormattedTimestamp()}.mt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    } catch(e) {
        console.error('Export .mt failed:', e);
    }
}

function importMTContent(content) {
    if (!content) return;
    pushSnapshot();
    let loadedTree = null;
    if (typeof content === 'object') {
        loadedTree = content.tree || (content.id && content.children ? content : null);
    } else if (typeof content === 'string') {
        loadedTree = parseMT(content) || parseMarkup(content);
    }
    if (loadedTree) {
        state.tree = loadedTree;
        state.focusedId = state.tree.id;
        state.treeVersion++;
        saveToStorage();
    }
}

// ── FLOATING NOTE ──
function openFloatingNote() {
    if (state.isEditing) return;
    
    if (state.isNoteOpen) { closeFloatingNote(); return; }
    
    const fn = document.getElementById('floatingNote');
    const node = findNode(state.tree, state.focusedId);
    fn.value = node ? node.note : '';
    fn.readOnly = false;
    fn.style.display = 'block';
    
    // Trigger CSS transition and focus textarea for typing
    requestAnimationFrame(() => {
        fn.classList.add('visible');
        fn.focus();
    });
    
    state.isNoteOpen = true;
}

function closeFloatingNote() {
    if (!state.isNoteOpen) return;
    const fn = document.getElementById('floatingNote');
    
    const node = findNode(state.tree, state.focusedId);
    if (node && node.note !== fn.value) { pushSnapshot(); node.note = fn.value; state.treeVersion++; saveToStorage(); }
    
    fn.blur();
    fn.classList.remove('visible');
    setTimeout(() => { if (!state.isNoteOpen) fn.style.display = 'none'; }, 150); // Hide after transition
    
    state.isNoteOpen = false;
}

// ── EXPORT & CLIPBOARD ──
function exportAsPNG() {
    try {
        if (!state.tree) return;

        const items = [];
        const connections = [];

        function calcSubtreeWidth(node) {
            const minW = 150;
            const children = getSortedChildren(node);
            if (children.length === 0) {
                node._exportW = minW;
                return minW;
            }
            let sumW = 0;
            for (const child of children) {
                sumW += calcSubtreeWidth(child);
            }
            node._exportW = Math.max(minW, sumW);
            return node._exportW;
        }

        calcSubtreeWidth(state.tree);

        const vGap = 140;
        function placeNode(node, x, y, level) {
            const r = level === 0 ? 56 : (level === 1 ? 46 : 38);
            const fs = level === 0 ? 15 : (level === 1 ? 13 : 11);
            const item = { node, x, y, r, fs, level };
            items.push(item);

            const children = getSortedChildren(node);
            if (children.length > 0) {
                let currentX = x - node._exportW / 2;
                for (const child of children) {
                    const childX = currentX + child._exportW / 2;
                    const childY = y + vGap;
                    connections.push({ parentX: x, parentY: y, childX, childY, parentItem: item, childNode: child });
                    placeNode(child, childX, childY, level + 1);
                    currentX += child._exportW;
                }
            }
        }

        placeNode(state.tree, 0, 0, 0);

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        items.forEach(item => {
            minX = Math.min(minX, item.x - item.r);
            maxX = Math.max(maxX, item.x + item.r);
            minY = Math.min(minY, item.y - item.r);
            maxY = Math.max(maxY, item.y + item.r);
        });

        if (minX === Infinity) return;

        const padding = 60;
        const width = Math.ceil(maxX - minX + padding * 2);
        const height = Math.ceil(maxY - minY + padding * 2);
        const offsetX = padding - minX;
        const offsetY = padding - minY;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = width * 2;
        offCanvas.height = height * 2;
        const offCtx = offCanvas.getContext('2d');
        offCtx.scale(2, 2);

        // Transparent background for clean, small PNG export

        // 1. Draw Connections
        connections.forEach(conn => {
            const x1 = conn.parentX + offsetX, y1 = conn.parentY + offsetY;
            const x2 = conn.childX + offsetX, y2 = conn.childY + offsetY;
            offCtx.save();
            offCtx.beginPath();
            offCtx.moveTo(x1, y1);
            offCtx.bezierCurveTo(x1, y1 + (y2 - y1) * 0.45, x2, y2 - (y2 - y1) * 0.45, x2, y2);
            offCtx.strokeStyle = CONFIG.colors.connection;
            offCtx.lineWidth = 2.5;
            offCtx.stroke();
            offCtx.restore();
        });

        // 2. Draw Nodes
        items.forEach(item => {
            const x = item.x + offsetX, y = item.y + offsetY, r = item.r;
            const isFocused = item.node.id === state.focusedId;

            offCtx.save();
            offCtx.beginPath();
            offCtx.arc(x, y, r, 0, Math.PI * 2);
            offCtx.fillStyle = CONFIG.colors.nodeFill;
            offCtx.fill();

            const borderColor = isFocused || item.level === 0 ? CONFIG.colors.selectedBorder : CONFIG.colors.border;
            offCtx.strokeStyle = borderColor;
            offCtx.lineWidth = isFocused ? 2.5 : 1.5;
            offCtx.stroke();

            if (item.node.note) {
                offCtx.beginPath();
                offCtx.arc(x + r * 0.6, y - r * 0.6, 4, 0, Math.PI * 2);
                offCtx.fillStyle = CONFIG.colors.noteDot;
                offCtx.fill();
            }

            let text = item.node.text || '...';
            const isRTL = /[\u0600-\u06FF]/.test(text);
            if ('direction' in offCtx) offCtx.direction = isRTL ? 'rtl' : 'ltr';
            offCtx.font = `500 ${item.fs}px ${CONFIG.font}`;
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';

            const maxWidth = r * 1.65;
            let displayText = text;
            if (offCtx.measureText(displayText).width > maxWidth) {
                while (displayText.length > 0 && offCtx.measureText(displayText + '…').width > maxWidth) {
                    displayText = displayText.slice(0, -1);
                }
                displayText = displayText ? displayText + '…' : '…';
            }

            offCtx.fillStyle = isFocused || item.level === 0 ? CONFIG.colors.text : (CONFIG.colors.textSecondary || CONFIG.colors.text);
            offCtx.fillText(displayText, x, y + 1);
            offCtx.restore();
        });

        const titleText = (state.tree && state.tree.text ? state.tree.text.trim() : 'mindmap').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
        const link = document.createElement('a');
        link.download = `${titleText}_${getFormattedTimestamp()}.png`;
        link.href = offCanvas.toDataURL('image/png');
        link.click();
    } catch(e) {
        console.error('Export PNG failed:', e);
    }
}

function copyMarkupToClipboard() {
    try {
        const markupText = serialize(state.tree);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(markupText);
        }
    } catch(e) {
        console.error('Copy failed:', e);
    }
}

// ── SAMPLE CATEGORY LOADER ──
const SAMPLES = {
    philosophy: DEFAULT_SAMPLE_MARKUP,
    science: `أقسام العلوم
\tالعلوم الطبيعية
\t\tالفيزياء
\t\t\tالفيزياء النظرية
\t\t\tالفيزياء التجريبية
\t\t\tعلم الفلك والكونيات
\t\tالكيمياء
\t\t\tالكيمياء العضوية
\t\t\tالكيمياء الحيوية
\t\t\tالكيمياء الفيزيائية
\t\tعلوم الأرض والبيئة
\t\t\tالجيولوجيا
\t\t\tعلم الأرصاد الجوية
\tالعلوم الحياتية
\t\tعلم الأحياء
\t\t\tعلم الخلية والوراثة
\t\t\tالأحياء الدقيقة
\t\t\tعلم البيئة
\t\tالعلوم الطبية
\t\t\tالطب البشري
\t\t\tالصيدلة والعقاقير
\t\t\tالعلوم العصبية
\tالعلوم التطبيقية
\t\tالهندسة
\t\t\tالهندسة الكهربائية
\t\t\tالهندسة الميكانيكية
\t\t\tالهندسة المدنية
\t\tالتكنولوجيا والمعلومات
\t\t\tالنظم المدمجة
\t\t\tالاتصالات والشبكات`,
    cs: `فروع علوم الحاسوب
\tالذكاء الاصطناعي
\t\tتعلم الآلة
\t\t\tالتعلم الخاضع للإشراف
\t\t\tالتعلم العميق
\t\tمعالجة اللغة الطبيعية
\t\t\tالتوليد النصي
\t\t\tفهم النصوص وتحليلها
\t\tالرؤية الحاسوبية
\t\t\tالتعرف على الصور
\t\t\tتتبع الكائنات
\tهندسة البرمجيات
\t\tالتصميم والمعمارية
\t\t\tأنماط التصميم
\t\t\tمعمارية الخدمات المصغرة
\t\tتطوير الأنظمة
\t\t\tتطوير الواجهات الأمامية
\t\t\tتطوير الخوادم والقواعد
\t\tجودة البرمجيات
\t\t\tالاختبارات الأوتوماتيكية
\t\t\tمراجعة الكود
\tأمن المعلومات
\t\tالأمن السيبراني
\t\t\tاختبار الاختراق
\t\t\tالحماية الجدارية
\t\tالتشفير
\t\t\tالتشفير المتماثل
\t\t\tالتشفير المفتاحي
\tعلوم البيانات
\t\tتحليل البيانات
\t\tالتنقيب في البيانات
\t\tقواعد البيانات الضخمة`,
    software: `دليل تخطيط المشاريع البرمجية
\tمرحلة التحليل والمتطلبات
\t\tتحديد النطاق والهدف
\t\tجمع متطلبات المستخدمين
\t\tدراسة الجدوى الفنية
\tمرحلة التصميم والمعمارية
\t\tتصميم واجهات المستخدم UI/UX
\t\tتصميم قاعدة البيانات Schemas
\t\tتحديد معمارية النظام Architecture
\tمرحلة التطوير والبرمجة
\t\tإعداد بيئة العمل Environment
\t\tكتابة الشفرة المصدريّة Code
\t\tالتكامل المستمر CI/CD
\tمرحلة الاختبار والجودة
\t\tاختبارات الوحدات Unit Tests
\t\tاختبارات الأداء والأمان
\t\tقبول المستخدم النهائي UAT
\tمرحلة الإطلاق والصيانة
\t\tالنشر على الخوادم Deployment
\t\tالمراقبة والدعم الفني Monitoring
\t\tالتحديثات والتحسينات Updates`
};

async function loadSampleByCategory(key) {
    try {
        const target = SAMPLES[key];
        if (!target) return;
        let content = '';
        if (target.endsWith && target.endsWith('.mt')) {
            const res = await fetch(target);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            content = await res.text();
        } else {
            content = target;
        }
        importMTContent(content);
        toggleSamplesMenu(false);
    } catch(err) {
        console.error('Failed to load sample:', err);
    }
}

function toggleSamplesMenu(show) {
    const menu = document.getElementById('samplesMenu');
    if (!menu) return;
    if (show === undefined) {
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    } else {
        menu.style.display = show ? 'flex' : 'none';
    }
}

// ── AI MIND MAP GENERATOR SERVER URL ──
function getAiServerUrl() {
    const host = window.location.hostname;
    // Local development (localhost / 127.0.0.1)
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        return 'http://localhost:8080';
    }
    // Production Cloudflare Worker (accessible from any device anywhere)
    return 'https://metafikra-mindmap-ai.alaabanna.workers.dev';
}

async function generateAiMindMap(promptText) {
    const errorEl = document.getElementById('aiErrorMsg');
    const loadingEl = document.getElementById('aiLoading');
    const submitBtn = document.getElementById('aiGenerateSubmit');
    
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
    if (loadingEl) loadingEl.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;

    try {
        const response = await fetch(`${getAiServerUrl()}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            const serverMsg = data.error || 'Failed to generate mind map via server';
            throw new Error(serverMsg);
        }

        importMTContent(data.markup);
        closeAiModal();
    } catch(err) {
        console.error('AI Generation Error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'Error communicating with AI server.';
            errorEl.style.display = 'block';
        }
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

function openAiModal() {
    const overlay = document.getElementById('aiModalOverlay');
    if (overlay) overlay.style.display = 'flex';
    const input = document.getElementById('aiPromptInput');
    if (input) { input.value = ''; input.focus(); }
}

function closeAiModal() {
    const overlay = document.getElementById('aiModalOverlay');
    if (overlay) overlay.style.display = 'none';
}