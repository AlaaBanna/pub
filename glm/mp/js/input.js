// Version: v1.5.0 | Updated: 2026-07-28 23:52 | Features: Master Keyboard Shortcut Registry standardization
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
    // Focused inside Floating Note (close note & keep current node focus)
    if (activeEl === document.getElementById('floatingNote')) {
        if (e.key === 'Escape' || (isCtrl && e.key === 'Enter')) { 
            e.preventDefault(); 
            closeFloatingNote(); 
            return; 
        }
        return;
    }

    // Focused inside Context Box Textarea
    if (activeEl === document.getElementById('cbTextarea')) {
        if (e.key === 'Escape') { e.preventDefault(); closeContextBox(); return; }
        if (isCtrl && e.key === 'Enter') { e.preventDefault(); rebuildFromMarkup(); return; }
        return;
    }

    // Focused inside Search Input
    if (activeEl === document.getElementById('searchInput')) {
        if (e.key === 'Escape') { e.preventDefault(); clearSearch(); activeEl.blur(); return; }
    }

    if (e.key === 'Escape') {
        if (state.isContextOpen) closeContextBox();
        if (state.isNoteOpen) closeFloatingNote();
        if (state.isHelpOpen) state.isHelpOpen = false;
        clearSearch();
        if (state.tree) {
            state.focusedId = state.tree.id;
            state.treeVersion++;
        }
        return;
    }

    // Global Save .mt File (Ctrl+S / Cmd+S)
    if (isCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        exportAsMT();
        return;
    }

    // Global Open / Upload .mt File (Ctrl+O / Cmd+O)
    if (isCtrl && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        document.getElementById('mtFileInput').click();
        return;
    }

    // Global toggle for Context Box (Ctrl+M / Cmd+M)
    if (isCtrl && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        toggleContextBox();
        return;
    }

    // Global Search (Ctrl+F / Cmd+F / '/')
    if ((isCtrl && (e.key === 'f' || e.key === 'F')) || (!isEditingInput && e.key === '/')) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
        return;
    }

    // Global Export PNG (Ctrl+E / Cmd+E)
    if (isCtrl && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportAsPNG();
        return;
    }

    // Node Input Editing state
    if (state.isEditing || activeEl === document.getElementById('nodeInput')) {
        if (e.key === 'Enter') { e.preventDefault(); hideNodeInput(true); return; }
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); confirmEditAndCreateChild(); return; }
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); hideNodeInput(true); createSibling(); return; }
        return; // Pass through character typing inside nodeInput
    }

    // Pass through if user is focused in any other text input element
    if (isEditingInput) return;

    if (isCtrl && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (isCtrl && e.key === 'y') { e.preventDefault(); redo(); return; }
    if (isCtrl && e.key === 'c') { e.preventDefault(); copyMarkupToClipboard(); return; }
    if ((isCtrl && e.altKey && (e.key === 'N' || e.key === 'n')) || (e.altKey && (e.key === 'N' || e.key === 'n'))) { e.preventDefault(); newMap(); return; }
    if (isCtrl && (e.key === 'N' || e.key === 'n')) { e.preventDefault(); }

    const isShift = e.shiftKey;

    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDelete(isShift); return; }
    if (e.key === 'F2') { e.preventDefault(); startEditing(); return; }
    if (e.key === 'Insert') { e.preventDefault(); createChild(); return; }
    if (e.key === 'Home') { e.preventDefault(); resetView(); return; }

    if (isCtrl && e.key === 'ArrowLeft') { e.preventDefault(); reorderNode(-1); return; }
    if (isCtrl && e.key === 'ArrowRight') { e.preventDefault(); reorderNode(1); return; }

    if (state.isOverview) {
        if (e.key === 'r' || e.key === 'R') { e.preventDefault(); resetView(); return; }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        return;
    }

    const isBottomUp = state.layoutDir === 'bottom-up';
    const keyChild = isBottomUp ? 'ArrowDown' : 'ArrowUp';
    const keyParent = isBottomUp ? 'ArrowUp' : 'ArrowDown';

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