document.addEventListener('keydown', (e) => {
    // Help toggle overrides everything
    if (e.key === '?') { e.preventDefault(); state.isHelpOpen = !state.isHelpOpen; return; }
    if (state.isHelpOpen) { if (e.key === 'Escape') { e.preventDefault(); state.isHelpOpen = false; } return; }

    // Note editing state
    if (state.isNoteOpen) {
        if (e.key === 'Escape') { 
            e.preventDefault(); 
            closeNote(); 
            return; 
        }
        
        // FIX: Intercept bare arrow keys to navigate the tree & refresh the note!
        // (If user holds Ctrl/Shift/Alt, let it pass to the textarea for text editing)
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            const isBottomUp = state.layoutDir === 'bottom-up';
            const keyChild = isBottomUp ? 'ArrowUp' : 'ArrowDown';
            const keyParent = isBottomUp ? 'ArrowDown' : 'ArrowUp';

            if (e.key === keyChild) { e.preventDefault(); navigateChild(); return; }
            if (e.key === keyParent) { e.preventDefault(); navigateParent(); return; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); navigateSibling(-1); return; }
            if (e.key === 'ArrowRight') { e.preventDefault(); navigateSibling(1); return; }
        }
        
        return; // Let all other keys (letters, numbers) go to the textarea normally
    }

    // FIX: If note is closed but panel is open, Escape now closes the panel
    if (e.key === 'Escape' && state.isPanelOpen) {
        e.preventDefault();
        togglePanel();
        return;
    }

    if (state.isEditing) {
        if (e.key === 'Enter') { e.preventDefault(); confirmEditAndCreateChild(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
        else if (e.key === 'Tab') { e.preventDefault(); confirmEditAndCreateChild(); }
        return;
    }

    // Global
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) { e.preventDefault(); togglePanel(); return; }

    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Delete') { e.preventDefault(); handleDelete(isShift); return; }
    if (isCtrl && e.key === 'ArrowLeft') { e.preventDefault(); reorderNode(-1); return; }
    if (isCtrl && e.key === 'ArrowRight') { e.preventDefault(); reorderNode(1); return; }

    if (state.isOverview) {
        if (e.key === 'd' || e.key === 'D') { e.preventDefault(); resetView(); }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        return;
    }

    // Spatial Navigation
    const isBottomUp = state.layoutDir === 'bottom-up';
    const keyChild = isBottomUp ? 'ArrowUp' : 'ArrowDown';
    const keyParent = isBottomUp ? 'ArrowDown' : 'ArrowUp';

    switch (e.key) {
        case keyChild: e.preventDefault(); navigateChild(); break;
        case keyParent: e.preventDefault(); navigateParent(); break;
        case 'ArrowLeft': e.preventDefault(); navigateSibling(-1); break;
        case 'ArrowRight': e.preventDefault(); navigateSibling(1); break;
        case 'n': case 'N': e.preventDefault(); openNote(); break;
        case 'v': case 'V': e.preventDefault(); toggleMode(); break;
        case 'g': case 'G': e.preventDefault(); toggleLayout(); break;
        case 'd': case 'D': e.preventDefault(); resetView(); break;
        case 'Enter': e.preventDefault(); startEditing(); break;
        case 'Tab': e.preventDefault(); createChild(); break;
    }
});

// Strict tab prevention
window.addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault(); }, true);