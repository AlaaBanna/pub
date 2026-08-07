// Version: v1.0.0 | Updated: 2026-08-07 | Features: Mind Map Actions, Node Editing & AI Integration Module
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
    if (state.isReadOnly) return;
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
    if (state.isReadOnly) return;
    if (state.focusedId) showNodeInput(state.focusedId);
}

function createChild() {
    if (state.isOverview || state.isReadOnly) return;
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
	العلوم الطبيعية
	::article # العلوم الطبيعية
	::article دراسة المادة والطاقة والكون والظواهر الطبيعية عبر الملاحظة والتجربة.
	\tالفيزياء
	\t::article # الفيزياء
	\t::article العلم الذي يدرس المادة والحركة والطاقة وتفاعلاتها الأساسية في الكون.
	\t\tالفيزياء النظرية
	\t\t::article بناء النماذج والنظريات الرياضية لتفسير الظواهر الطبيعية والتنبؤ بها.
	\t\tالفيزياء التجريبية
	\t\t::article تصميم واختبار التجارب المختبرية للتحقق من صحة القوانين الفيزيائية.
	\t\tعلم الفلك والكونيات
	\t\t::article دراسة الأجرام السماوية والمجرات وأصل نشأة الكون وتطوره.
	\tالكيمياء
	\t::article # الكيمياء
	\t::article دراسة تركيب المواد وخصائصها وتفاعلاتها وتحولاتها من حالة إلى أخرى.
	\t\tالكيمياء العضوية
	\t\t::article دراسة مركبات الكربون وتطبيقاتها في الصناعة والصيدلة.
	\t\tالكيمياء الحيوية
	\t\t::article دراسة التفاعلات والعمليات الكيميائية داخل الكائنات الحية.
	\t\tالكيمياء الفيزيائية
	\t\t::article دراسة الأصل الفيزيائي للتفاعلات الكيميائية وتغيرات الطاقة.
	\tعلوم الأرض والبيئة
	\t\tالجيولوجيا
	\t\t::article دراسة طبقات الأرض والصخور والموارد الطبيعية وتاريخ الكوكب.
	\t\tعلم الأرصاد الجوية
	\t\t::article دراسة الغلاف الجوي والطقس والمناخ والتنبؤات الجوية.
	العلوم الحياتية
	::article # العلوم الحياتية
	::article دراسة الكائنات الحية من الخلية المفردة إلى الأنظمة البيئية المعقدة.
	\tعلم الأحياء
	\t\tعلم الخلية والوراثة
	\t\t::article دراسة تركيب الخلايا والـ DNA وانتقال الصفات الوراثية عبر الأجيال.
	\t\tالأحياء الدقيقة
	\t\t::article دراسة البكتيريا والفيروسات والكائنات الدقيقة وتطبيقاتها.
	\t\tعلم البيئة
	\t\t::article دراسة العلاقات المتبادلة بين الكائنات الحية وبيئاتها المحيطة.
	\tالعلوم الطبية
	\t\tالطب البشري
	\t\t::article تشخيص الأمراض وعلاجها والوقاية منها لتحسين صحة الإنسان.
	\t\tالصيدلة والعقاقير
	\t\t::article اكتشاف وتصنيع الأدوية واختبار أمانها وفاعليتها العلاجية.
	\t\tالعلوم العصبية
	\t\t::article دراسة الجهاز العصبي والمخ والدماغ والوظائف الإدراكية.
	العلوم التطبيقية
	::article # العلوم التطبيقية
	::article تطبيق المعرفة العلمية لتطوير حلول تقنية وهندسية عملية تخدم المجتمع.
	\tالهندسة
	\t\tالهندسة الكهربائية
	\t\t::article تصميم وتطوير الأنظمة الكهربائية والإلكترونيات وشبكات الطاقة.
	\t\tالهندسة الميكانيكية
	\t\t::article تصميم وتصنيع المحركات والآلات والأنظمة الحرارية.
	\t\tالهندسة المدنية
	\t\t::article تصميم وبناء البنية التحتية من جسور ومبانٍ وشبكات مياه.
	\tالتكنولوجيا والمعلومات
	\t\tالنظم المدمجة
	\t\t::article تصميم الأجهزة الإلكترونية المدمجة ببرمجيات تشغيل مخصصة.
	\t\tالاتصالات والشبكات
	\t\t::article تطوير شبكات نقل البيانات والاتصالات السلكية واللاسلكية.`,
    cs: `فروع علوم الحاسوب
	الذكاء الاصطناعي
	::article # الذكاء الاصطناعي
	::article محاكاة القدرات الإدراكية البشرية بواسطة الأنظمة الحاسوبية والبرمجيات الذكية.
	::article 
	::article ### التطبيقات الرئيسية:
	::article - **تعلم الآلة**: بناء نماذج تتعلّم تلقائياً من البيانات.
	::article - **معالجة اللغة**: تحليل وفهم اللغة الطبيعية.
	\tتعلم الآلة
	\t::article # تعلم الآلة (Machine Learning)
	\t::article تطوير خوارزميات تمكن الحاسوب من التعلم والتنبؤ بناءً على البيانات والتجارب.
	\t\tالتعلم الخاضع للإشراف
	\t\t::article تدريب النماذج باستخدام بيانات معنونة للوصول إلى توقعات دقيقة.
	\t\tالتعلم العميق
	\t\t::article استخدام الشبكات العصبيّة الاصطناعية المتعددة الطبقات للتعامل مع البيانات المعقدة.
	\tمعالجة اللغة الطبيعية
	\t::article تمكين الحاسوب من قراءة وفهم وتوليد النصوص البشرية بمرونة عالية.
	\t\tالتوليد النصي
	\t\t::article صياغة وتوليد المحتوى الكتابي باستخدام النماذج اللغوية الضخمة (LLMs).
	\t\tفهم النصوص وتحليلها
	\t\t::article استخراج المعاني والكيانات وتحليل المشاعر من النصوص المخزنة.
	\tالرؤية الحاسوبية
	\t::article تمكين الأنظمة من معالجة وفهم الصور والفيديوهات الرقمية.
	\t\tالتعرف على الصور
	\t\t::article تصنيف الصور وتحديد العناصر والأجسام المضمنة فيها.
	\t\tتتبع الكائنات
	\t\t::article تتبع حركة العناصر في مقاطع الفيديو البث المباشر.
	هندسة البرمجيات
	::article # هندسة البرمجيات
	::article تطبيق نهج منهجي لتصميم وتطوير واختبار وصيانة البرمجيات بجودة عالية.
	\tالتصميم والمعمارية
	\t::article هيكلة الأنظمة البرمجية وتحديد طريقة تفاعل مكوناتها الداخلية.
	\t\tأنماط التصميم
	\t\t::article حلول معمارية مكررة ومثبتة للمشاكل البرمجية الشائعة.
	\t\tمعمارية الخدمات المصغرة
	\t\t::article تقسيم التطبيق إلى خدمات مستقلة صغيرة تتواصل عبر APIs.
	\tتطوير الأنظمة
	\t\tتطوير الواجهات الأمامية
	\t\t::article بناء الواجهات التفاعلية للمستخدمين باستخدام HTML, CSS, JavaScript.
	\t\tتطوير الخوادم والقواعد
	\t\t::article بناء منطق الأعمال ومعالجة قواعد البيانات والـ APIs في الخلفية.
	\tجودة البرمجيات
	\t\tالاختبارات الأوتوماتيكية
	\t\t::article كتابة فحوصات آلية للتحقق من سلامة الأكواد واستقرار التطبيق.
	\t\tمراجعة الكود
	\t\t::article مراجعة الأكواد بين المطورين لضمان الاتساق والأمان.
	أمن المعلومات
	::article # أمن المعلومات
	::article حماية الأنظمة والشبكات والبيانات من الهجمات الرقمية والوصول غير المصرح به.
	\tالأمن السيبراني
	\t\tاختبار الاختراق
	\t\t::article فحص الأنظمة اكتشاف الثغرات الأمنية قبل استغلالها من المهاجمين.
	\t\tالحماية الجدارية
	\t\t::article إعداد جدران النارية لمنع الحركة غير المشروعة للبيانات.
	\tالتشفير
	\t\tالتشفير المتماثل
	\t\t::article استخدام مفتاح سرّي واحد لتشفير البيانات وفك تشفيرها.
	\t\tالتشفير المفتاحي
	\t\t::article استخدام زوج من المفاتيح (عام وخاص) لتأمين تبادل البيانات.
	علوم البيانات
	::article # علوم البيانات
	::article استخراج المعرفة والرؤى القيمة من كميات ضخمة من البيانات الهيكلية وغير الهيكلية.
	\tتحليل البيانات
	\t::article فحص وتنظيف وتحويل البيانات لاكتشاف النماذج المفيدة واتخاذ القرارات.
	\tالتنقيب في البيانات
	\t::article استكشاف الأنماط والارتباطات المخفية داخل مجموعات البيانات الكبيرة.
	\tقواعد البيانات الضخمة
	\t::article التعامل مع حجم وسرعة وتنوع البيانات الكبيرة باستخدام أدوات حديثة.`,
    software: `دليل تخطيط المشاريع البرمجية
	مرحلة التحليل والمتطلبات
	::article # مرحلة التحليل والمتطلبات
	::article جمع ودراسة كافة متطلبات المشروع البرمجي وصياغة وثيقة النطاق المواصفات.
	\tتحديد النطاق والهدف
	\t::article تحديد الحدود الفنية والإدارية للمشروع والغايات الأساسية المطلوبة.
	\tجمع متطلبات المستخدمين
	\t::article إجراء المقابلات واستطلاعات الرأي لفهم احتياجات المستخدم النهائي.
	\tدراسة الجدوى الفنية
	\t::article تقييم تقنيات البناء والتكاليف المتوقعة والتقنيات المناسبة.
	مرحلة التصميم والمعمارية
	::article # مرحلة التصميم والمعمارية
	::article تخطيط هيكل النظام واختيار المعمارية المناسبة ورسم واجهات المستخدم.
	\tتصميم واجهات المستخدم UI/UX
	\t::article بناء نماذج تجريبية وتجربة مستخدم سلسة وجذابة بصرياً.
	\tتصميم قاعدة البيانات Schemas
	\t::article رسم الجداول والروابط والـ D1 SQL Schemas لتخزين البيانات بكفاءة.
	\tتحديد معمارية النظام Architecture
	\t::article اختيار التقنيات ولغات البرمجة ونمط الخوادم المتناسب مع الحمل.
	مرحلة التطوير والبرمجة
	::article # مرحلة التطوير والبرمجة
	::article كتابة الكود البرمجي وبناء المكونات وبناء التكامل المستمر.
	\tإعداد بيئة العمل Environment
	\t::article تجهيز الأدوات والمستودعات البرمجية وبيئة التطوير المحلية.
	\tكتابة الشفرة المصدريّة Code
	\t::article تنفيذ المنطق البرمجي واختبار المكونات بشكل دوري.
	\tالتكامل المستمر CI/CD
	\t::article أتمتة عمليات بناء ونشر الكود إلى خوادم الاختبار والإطلاق.
	مرحلة الاختبار والجودة
	::article # مرحلة الاختبار والجودة
	::article التأكد من خلو التطبيق من العيوب البرمجية ومطابقته للمتطلبات الأمنية والأداء.
	\tاختبارات الوحدات Unit Tests
	\t::article فحص الوظائف البرمجية الفردية بصورة مستقلة.
	\tاختبارات الأداء والأمان
	\t::article فحص قدرة النظام على تحمل الزحام وحماية البيانات.
	\tقبول المستخدم النهائي UAT
	\t::article إتاحة النظام للمستخدمين لاختباره والموافقة على جاهزيته.
	مرحلة الإطلاق والصيانة
	::article # مرحلة الإطلاق والصيانة
	::article نشر التطبيق للمستخدمين وتوفير الدعم المباشر والتحديثات المستمرة.
	\tالنشر على الخوادم Deployment
	\t::article إطلاق التطبيق على منصات الاستضافة والسحاب مثل Cloudflare.
	\tالمراقبة والدعم الفني Monitoring
	\t::article متابعة أداء السيرفرات والأخطاء وحل البلاغات الفنية فوراً.
	\tالتحديثات والتحسينات Updates
	\t::article إضافة مزايا جديدة بناءً على ملاحظات المستخدمين وتطوير النظام.`
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
    return (typeof API_BASE !== 'undefined') ? API_BASE : window.location.origin;
}

async function generateAiMindMap(promptText) {
    const errorEl = document.getElementById('aiErrorMsg');
    const loadingEl = document.getElementById('aiLoading');
    const submitBtn = document.getElementById('aiGenerateSubmit');
    const statusTextEl = document.getElementById('aiLoadingStatusText');
    
    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
    if (loadingEl) loadingEl.style.display = 'flex';
    if (submitBtn) submitBtn.disabled = true;

    const loadingMessages = [
        'جاري استدعاء المعرفة وتنظيم الأفكار...',
        'نسج الهيكل الشجري والمفاهيم...',
        'صياغة المقالات الشارحة والتوضيحات...',
        'تحضير الخريطة الذهنية التفاعلية...'
    ];
    let msgIndex = 0;
    if (statusTextEl) statusTextEl.textContent = loadingMessages[0];

    const messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        if (statusTextEl) {
            statusTextEl.style.opacity = '0';
            setTimeout(() => {
                statusTextEl.textContent = loadingMessages[msgIndex];
                statusTextEl.style.opacity = '1';
            }, 180);
        }
    }, 1600);

    try {
        const response = await fetch(`${getAiServerUrl()}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            const serverMsg = data.error || 'فشل توليد الخريطة من الخادم';
            throw new Error(serverMsg);
        }

        importMTContent(data.markup);
        closeAiModal();
    } catch(err) {
        console.error('AI Generation Error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'حدث خطأ أثناء الاتصال بخادم الذكاء الاصطناعي.';
            errorEl.style.display = 'block';
        }
    } finally {
        clearInterval(messageInterval);
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