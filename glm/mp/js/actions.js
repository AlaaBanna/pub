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

// ── NODE EDITING ──
function showNodeInput(id) {
    const node = findNode(state.tree, id);
    if (!node) return;
    const inp = document.getElementById('nodeInput');
    editingId = id; state.isEditing = true;
    inp.value = node.text; inp.style.display = 'block';
    
    const a = state.animNodes[id];
    if (a) {
        const z = state.targetZoom;
        const screenX = (a.x - cw/2) * z + cw/2;
        const screenY = (a.y - ch/2) * z + ch/2;
        
        inp.style.left = (screenX - 90) + 'px';
        inp.style.top = (screenY - 18) + 'px';
        inp.style.width = Math.max(160, Math.min(320, a.r * 1.6 * z + 40)) + 'px';
    }
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

function createChild() {
    if (state.mode !== 'edit' || state.isOverview) return;
    pushSnapshot();
    const focusedNode = findNode(state.tree, state.focusedId);
    if (!focusedNode) return;
    const newChild = createNode('', focusedNode.children.length);
    focusedNode.children.push(newChild);
    state.focusedId = newChild.id;
    state.treeVersion++;
    showNodeInput(newChild.id);
}

function confirmEditAndCreateChild() { hideNodeInput(true); createChild(); }
function cancelEdit() { hideNodeInput(false); }

// ── NAVIGATION ──
function navigateChild() {
    const node = findNode(state.tree, state.focusedId);
    if (!node || node.children.length === 0) return;
    const sorted = getSortedChildren(node);
    state.focusedId = sorted[0].id;
    state.deletePending = null; state.treeVersion++; updateNotePanel();
}

function navigateParent() {
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) return;
    state.focusedId = parent.id;
    state.deletePending = null; state.treeVersion++; updateNotePanel();
}

function navigateSibling(dir) { 
    const parent = findParent(state.tree, state.focusedId, null);
    if (!parent) return;
    const sorted = getSortedChildren(parent);
    const idx = sorted.findIndex(c => c.id === state.focusedId);
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < sorted.length) {
        state.focusedId = sorted[nextIdx].id;
        state.deletePending = null; state.treeVersion++; updateNotePanel();
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
    if (!parent) { state.tree = createNode('New Map'); state.focusedId = state.tree.id; } 
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
    updateModeBadge(); if (state.isNoteOpen) updateNotePanel();
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

// ── NOTES ──
function openNote() {
    if (state.isEditing) return;
    
    // FIX: Auto-open the side panel if it's closed
    if (!state.isPanelOpen) togglePanel(); 
    
    state.isNoteOpen = true; updateNotePanel();
    const na = document.getElementById('noteArea');
    na.readOnly = state.mode === 'view'; na.focus();
}

function closeNote() {
    if (!state.isNoteOpen) return;
    const na = document.getElementById('noteArea');
    if (state.mode === 'edit') {
        const node = findNode(state.tree, state.focusedId);
        if (node && node.note !== na.value) { pushSnapshot(); node.note = na.value; state.treeVersion++; }
    }
    state.isNoteOpen = false; na.blur();
}

function updateNotePanel() {
    if (!state.isNoteOpen) return;
    const na = document.getElementById('noteArea');
    const node = findNode(state.tree, state.focusedId);
    na.value = node ? node.note : '';
    na.readOnly = state.mode === 'view';
}