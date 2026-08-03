// Version: v2.7.2 | Updated: 2026-07-31 13:11 | Features: Explicit Arabic key ى/آ mapping for N post-it note shortcut
document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isEditingInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCtrl = e.ctrlKey || e.metaKey;

    // Node Input Editing state (Cancel Edit on Escape, Confirm on Enter/Tab)
    if (state.isEditing || activeEl === document.getElementById('nodeInput')) {
        if (e.key === 'Enter') { e.preventDefault(); hideNodeInput(true); return; }
        if (e.key === 'Escape') { 
            e.preventDefault(); 
            cancelEdit(); 
            const nodeInp = document.getElementById('nodeInput');
            if (nodeInp) nodeInp.blur();
            return; 
        }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); confirmEditAndCreateChild(); return; }
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); hideNodeInput(true); createSibling(); return; }
        return; // Pass through character typing inside nodeInput
    }

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

    // Universal ESC Key Handler (Closes any active modal, panel, drawer, popup, search, or input)
    if (e.key === 'Escape') {
        e.preventDefault();
        if (window.closeAllModalsAndPanels) {
            window.closeAllModalsAndPanels();
        }
        return;
    }

    // Inside Article Modal Shortcuts (Enter to toggle read status when not editing markdown)
    const articleModal = document.getElementById('articleModal');
    if (articleModal && articleModal.style.display !== 'none') {
        const isEditingMarkdown = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.classList.contains('CodeMirror-code') || activeEl.closest('.CodeMirror'));
        if (e.key === 'Enter' && !isEditingMarkdown) {
            e.preventDefault();
            toggleCurrentArticleRead();
            return;
        }
        if (isEditingMarkdown) return;
    }

    // Global Save .mt File (Ctrl+S / Cmd+S)
    if (isCtrl && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        exportAsMT();
        return;
    }

    // Global Open / Upload .mt File (Ctrl+O / Cmd+O)
    if (isCtrl && (e.code === 'KeyO' || e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        document.getElementById('mtFileInput').click();
        return;
    }

    // Global Search (Ctrl+F / Cmd+F / '/')
    if ((isCtrl && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F')) || (!isEditingInput && (e.code === 'Slash' || e.key === '/'))) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
        return;
    }

    // Global Export PNG (Ctrl+E / Cmd+E)
    if (isCtrl && (e.code === 'KeyE' || e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportAsPNG();
        return;
    }

    // Pass through if user is focused in any other text input element
    if (isEditingInput) return;

    if (isCtrl && (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }
    if (isCtrl && (e.code === 'KeyY' || e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
    if (isCtrl && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C')) { e.preventDefault(); copyMarkupToClipboard(); return; }
    if (e.altKey && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N')) { e.preventDefault(); newMap(); return; }

    const isShift = e.shiftKey;

    if (e.key === 'Delete' || e.key === 'Backspace' || e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); handleDelete(isShift); return; }
    if (e.key === 'F2' || e.code === 'F2') { e.preventDefault(); startEditing(); return; }
    if (e.key === 'Insert' || e.code === 'Insert') { e.preventDefault(); createChild(); return; }
    if (e.key === 'Home' || e.code === 'Home') { e.preventDefault(); resetView(); return; }

    if (isCtrl && (e.key === 'ArrowLeft' || e.code === 'ArrowLeft')) { e.preventDefault(); reorderNode(-1); return; }
    if (isCtrl && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) { e.preventDefault(); reorderNode(1); return; }

    if (state.isOverview) {
        if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') { e.preventDefault(); resetView(); return; }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        return;
    }

    const isBottomUp = state.layoutDir === 'bottom-up';
    const keyChild = isBottomUp ? 'ArrowDown' : 'ArrowUp';
    const keyParent = isBottomUp ? 'ArrowUp' : 'ArrowDown';

    if (e.key === keyChild) { e.preventDefault(); navigateChild(); return; }
    if (e.key === keyParent) { e.preventDefault(); navigateParent(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigateSibling(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); navigateSibling(1); return; }
    
    // Global AI Generator Modal Shortcut (Alt+A / Cmd+Shift+A)
    if ((e.altKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ش')) || (isCtrl && e.shiftKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        openAiModal();
        return;
    }

    // Global About Modal Shortcut (Key I / Alt+I / Cmd+Shift+I / هـ)
    if ((e.code === 'KeyI' || e.key === 'i' || e.key === 'I' || e.key === 'هـ') || (e.altKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')) || (isCtrl && e.shiftKey && (e.code === 'KeyI' || e.key === 'i' || e.key === 'I'))) {
        e.preventDefault();
        const abtModal = document.getElementById('aboutModal');
        if (abtModal && abtModal.style.display !== 'none') {
            closeAboutModal();
        } else {
            openAboutModal();
        }
        return;
    }

    // Spacebar or N key opens Article Modal for focused node
    if (e.code === 'Space' || e.key === ' ' || e.code === 'KeyN' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openArticleModal();
        return;
    }

    if (e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ش') { e.preventDefault(); openAiModal(); return; }
    if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') { e.preventDefault(); toggleLayout(); return; }
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') { e.preventDefault(); resetView(); return; }
    if (e.key === 'Enter' || e.code === 'Enter') { e.preventDefault(); startEditing(); return; }
    if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) createSibling();
        else createChild();
    }
});