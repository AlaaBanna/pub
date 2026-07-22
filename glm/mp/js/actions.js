let editingId = null;

// ── UNDO / REDO ──
function pushSnapshot() {
    state.undoStack.push({ t: clone(state.tree), f: state.focusedId });
    if (state.undoStack.length > CONFIG.undoMaxStates) state.undoStack.shift();
    state.redoStack = [];
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
        if (node) { node.text = inp.value; state.treeVersion++; saveToStorage(); }
    }
    inp.style.display = 'none'; inp.blur();
    state.isEditing = false; editingId = null;
}

function startEditing() {
    if (state.mode !== 'edit' || state.isOverview) return;
    showNodeInput(state.focusedId);
}

function ensureEditMode() {
    if (state.mode !== 'edit') {
        state.mode = 'edit';
        updateModeBadge();
    }
}

function createChild() {
    if (state.isOverview) return;
    ensureEditMode();
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
    ensureEditMode();
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
    if (state.isContextOpen) closeContextBox();
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
    if (state.mode !== 'edit' || state.isOverview) return;
    if (state.deletePending === state.focusedId && isShift) { executeDelete(); return; }
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
    if (state.mode !== 'edit' || state.isOverview) return;
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
function toggleMode() {
    state.mode = state.mode === 'view' ? 'edit' : 'view';
    updateModeBadge();
}

function updateModeBadge() {
    const badge = document.getElementById('modeBadge');
    badge.textContent = state.mode === 'view' ? 'VIEW' : 'EDIT';
    badge.className = state.mode;
}

function resetView() {
    state.targetZoom = 0.9; 
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
    cb.classList.toggle('open', state.isContextOpen);

    if (state.isContextOpen) {
        const ta = document.getElementById('cbTextarea');
        ta.value = serialize(state.tree);
        ta.focus();
        ta.select();
    }
}

function closeContextBox() {
    state.isContextOpen = false;
    document.getElementById('contextBox').classList.remove('open');
}

function copyMarkupFromPanel() {
    const ta = document.getElementById('cbTextarea');
    if (!ta.value.trim()) ta.value = serialize(state.tree);
    copyMarkupToClipboard();
}

function rebuildFromMarkup() {
    const text = document.getElementById('cbTextarea').value.trim();
    if (!text) return;
    pushSnapshot();
    state.tree = parseMarkup(text);
    state.focusedId = state.tree.id;
    state.treeVersion++;
    saveToStorage();
    closeContextBox();
}

// ── FLOATING NOTE ──
function openFloatingNote() {
    if (state.isEditing) return;
    
    if (state.isNoteOpen) { closeFloatingNote(); return; }
    
    const fn = document.getElementById('floatingNote');
    const node = findNode(state.tree, state.focusedId);
    fn.value = node ? node.note : '';
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
    
    if (state.mode === 'edit') {
        const node = findNode(state.tree, state.focusedId);
        if (node && node.note !== fn.value) { pushSnapshot(); node.note = fn.value; state.treeVersion++; saveToStorage(); }
    }
    
    fn.blur();
    fn.classList.remove('visible');
    setTimeout(() => { if (!state.isNoteOpen) fn.style.display = 'none'; }, 150); // Hide after transition
    
    state.isNoteOpen = false;
}

// ── EXPORT & CLIPBOARD ──
function exportAsPNG() {
    try {
        const ids = Object.keys(state.animNodes);
        if (ids.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        ids.forEach(id => {
            const a = state.animNodes[id];
            if (!a || a.ta < 0.05) return;
            const r = a.r || 50;
            minX = Math.min(minX, a.x - r);
            maxX = Math.max(maxX, a.x + r);
            minY = Math.min(minY, a.y - r);
            maxY = Math.max(maxY, a.y + r);
        });

        if (minX === Infinity) return;

        const padding = 80;
        const width = Math.ceil(maxX - minX + padding * 2);
        const height = Math.ceil(maxY - minY + padding * 2);
        const offsetX = padding - minX;
        const offsetY = padding - minY;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = width * 2;
        offCanvas.height = height * 2;
        const offCtx = offCanvas.getContext('2d');
        offCtx.scale(2, 2);

        // 1. Draw Connectors with high contrast & full opacity
        const drawExportBezier = (id1, id2, color, alpha = 0.85) => {
            const a1 = state.animNodes[id1], a2 = state.animNodes[id2];
            if (!a1 || !a2) return;
            const x1 = a1.x + offsetX, y1 = a1.y + offsetY;
            const x2 = a2.x + offsetX, y2 = a2.y + offsetY;
            offCtx.save();
            offCtx.globalAlpha = alpha;
            offCtx.beginPath();
            offCtx.moveTo(x1, y1);
            offCtx.bezierCurveTo(x1, y1 + (y2 - y1) * 0.4, x2, y2 - (y2 - y1) * 0.4, x2, y2);
            offCtx.strokeStyle = color;
            offCtx.lineWidth = 2.5;
            offCtx.stroke();
            offCtx.restore();
        };

        const parentNode = findParent(state.tree, state.focusedId, null);
        if (parentNode) {
            for (const sib of getSortedChildren(parentNode)) {
                drawExportBezier(parentNode.id, sib.id, CONFIG.colors.selectedBorder, 0.75);
            }
        }
        const focusedNode = findNode(state.tree, state.focusedId);
        if (focusedNode) {
            for (const child of getSortedChildren(focusedNode)) {
                if (state.animNodes[child.id]) {
                    drawExportBezier(state.focusedId, child.id, CONFIG.colors.selectedBorder, 0.95);
                }
            }
        }

        // 2. Draw Nodes
        ids.forEach(id => {
            const a = state.animNodes[id];
            if (!a || a.ta < 0.05) return;
            const node = findNode(state.tree, id);
            if (!node) return;

            const x = a.x + offsetX, y = a.y + offsetY, r = a.r;
            const isFoc = id === state.focusedId;

            offCtx.save();
            offCtx.beginPath();
            offCtx.arc(x, y, r, 0, Math.PI * 2);
            offCtx.fillStyle = CONFIG.colors.nodeFill;
            offCtx.fill();
            offCtx.strokeStyle = isFoc ? CONFIG.colors.selectedBorder : CONFIG.colors.border;
            offCtx.lineWidth = isFoc ? 2.5 : 1.5;
            offCtx.stroke();

            // Text
            let text = node.text || '...';
            const isRTL = /[\u0600-\u06FF]/.test(text);
            if ('direction' in offCtx) offCtx.direction = isRTL ? 'rtl' : 'ltr';
            offCtx.font = `500 ${a.fs}px ${CONFIG.font}`;
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillStyle = a.tc;
            offCtx.fillText(text, x, y + 1);
            offCtx.restore();
        });

        const link = document.createElement('a');
        link.download = `mindmap-${Date.now()}.png`;
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