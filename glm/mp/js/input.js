// Version: v1.1.0 | Updated: 2026-07-28 | Features: New Map shortcut (Ctrl+Alt+N / Alt+N) conflict fix
document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isEditingInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCtrl = e.ctrlKey || e.metaKey;

    // 1. Help overlay toggle
    if (e.key === '?') {
        if (!isEditingInput) {
            e.preventDefault();
            state.isHelpOpen = !state.isHelpOpen;
            return;
        }
    }
    if (state.isHelpOpen) {
        if (e.key === 'Escape') { e.preventDefault(); state.isHelpOpen = false; }
        return;
    }

    // Global toggle for Context Box (Ctrl+M / Cmd+M)
    if (isCtrl && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        toggleContextBox();
        return;
    }

    // Global Export PNG (Ctrl+E / Cmd+E)
    if (isCtrl && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportAsPNG();
        return;
    }

    // 2. Focused inside Floating Note
    if (activeEl === document.getElementById('floatingNote')) {
        if (e.key === 'Escape') { e.preventDefault(); closeFloatingNote(); return; }
        if (isCtrl && e.key === 'Enter') { e.preventDefault(); closeFloatingNote(); return; }
        return; // Pass through text keys, 'n'/'N', and arrows to note textarea
    }

    // 3. Focused inside Context Box Textarea
    if (activeEl === document.getElementById('cbTextarea')) {
        if (e.key === 'Escape') { e.preventDefault(); closeContextBox(); return; }
        if (isCtrl && e.key === 'Enter') { e.preventDefault(); rebuildFromMarkup(); return; }
        return; // Pass through text keys to markup textarea
    }

    // 4. Node Input Editing state
    if (state.isEditing || activeEl === document.getElementById('nodeInput')) {
        if (e.key === 'Enter') { e.preventDefault(); hideNodeInput(true); return; }
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); confirmEditAndCreateChild(); return; }
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); hideNodeInput(true); createSibling(); return; }
        return; // Pass through character typing inside nodeInput
    }

    // Pass through if user is focused in any other text input element
    if (isEditingInput) return;

    // 5. Global Navigation & Canvas Shortcuts (Non-Input context)
    if (e.key === 'Escape') {
        if (state.isNoteOpen) { e.preventDefault(); closeFloatingNote(); return; }
        if (state.isContextOpen) { e.preventDefault(); closeContextBox(); return; }
    }

    if (isCtrl && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (isCtrl && e.key === 'y') { e.preventDefault(); redo(); return; }
    if (isCtrl && e.key === 'c') { e.preventDefault(); copyMarkupToClipboard(); return; }
    if ((isCtrl && e.altKey && (e.key === 'N' || e.key === 'n')) || (e.altKey && (e.key === 'N' || e.key === 'n'))) { e.preventDefault(); newMap(); return; }
    if (isCtrl && (e.key === 'N' || e.key === 'n')) { e.preventDefault(); }

    const isShift = e.shiftKey;

    if (e.key === 'Delete') { e.preventDefault(); handleDelete(isShift); return; }
    if (isCtrl && e.key === 'ArrowLeft') { e.preventDefault(); reorderNode(-1); return; }
    if (isCtrl && e.key === 'ArrowRight') { e.preventDefault(); reorderNode(1); return; }

    if (state.isOverview) {
        if (e.key === 'r' || e.key === 'R') { e.preventDefault(); resetView(); return; }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        return;
    }

    const isBottomUp = state.layoutDir === 'bottom-up';
    const keyChild = isBottomUp ? 'ArrowUp' : 'ArrowDown';
    const keyParent = isBottomUp ? 'ArrowDown' : 'ArrowUp';

    switch (e.key) {
        case keyChild: e.preventDefault(); navigateChild(); break;
        case keyParent: e.preventDefault(); navigateParent(); break;
        case 'ArrowLeft': e.preventDefault(); navigateSibling(-1); break;
        case 'ArrowRight': e.preventDefault(); navigateSibling(1); break;
        case 'n': case 'N': e.preventDefault(); openFloatingNote(); break;
        case 'v': case 'V': e.preventDefault(); toggleMode(); break;
        case 'g': case 'G': e.preventDefault(); toggleLayout(); break;
        case 'r': case 'R': e.preventDefault(); resetView(); break;
        case 'Enter': e.preventDefault(); startEditing(); break;
        case 'Tab':
            e.preventDefault();
            if (e.shiftKey) createSibling();
            else createChild();
            break;
    }
});