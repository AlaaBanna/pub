// Version: v1.0.1 | Updated: 2026-08-07 | Features: App Bootstrap, Canvas Setup & Main Animation Loop

// ── GLOBALS ──
let cw, ch, lastTime = 0, prevVersion = -1;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const state = {
    tree: null, focusedId: null,
    isEditing: false, isNoteOpen: false, isHelpOpen: false,
    isOverview: false, layoutDir: 'top-down', 
    targetZoom: 1.0, deletePending: null, deletePendingTime: 0,
    undoStack: [], redoStack: [], treeVersion: 0, animNodes: {},
    hoveredId: null, isMobile: false, helpCloseBtn: null
};

// ── DEFAULT DATA ──
const DEFAULT_SAMPLE = "root";

// ── UNIFIED CLOSE ALL MODALS & PANELS HELPER ──
window.closeAllModalsAndPanels = function() {
    // 1. Close Modals & Overlays
    if (typeof closeArticleModal === 'function') closeArticleModal();

    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'none';

    const cloudDrawer = document.getElementById('cloudMapsDrawer');
    if (cloudDrawer) cloudDrawer.style.display = 'none';

    const shareModal = document.getElementById('shareModal');
    if (shareModal) shareModal.style.display = 'none';

    const aiModalOverlay = document.getElementById('aiModalOverlay');
    if (aiModalOverlay) aiModalOverlay.style.display = 'none';

    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) aboutModal.style.display = 'none';

    if (typeof state !== 'undefined' && state) state.isHelpOpen = false;

    // 2. Close Dropdowns & Popovers
    document.querySelectorAll('.hdr-dropdown-panel, .samples-popover, #samplesMenu, .menu-panel').forEach(p => p.style.display = 'none');

    // 3. Close floating note if open
    if (typeof state !== 'undefined' && state && state.isNoteOpen && typeof closeFloatingNote === 'function') {
        closeFloatingNote();
    }

    // 4. Cancel active node input editing if open
    if (typeof state !== 'undefined' && state && state.isEditing && typeof hideNodeInput === 'function') {
        hideNodeInput(false);
    }

    // 5. Clear search if active
    const searchInput = document.getElementById('searchInput');
    if (searchInput && document.activeElement === searchInput) {
        searchInput.blur();
    }
    if (typeof clearSearch === 'function') {
        clearSearch();
    }
};

function closeAllDropdowns() {
    window.closeAllModalsAndPanels();
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

// ── MOUSE GESTURES ──
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

    if (hitId) {
        // Eye Badge Hit Test (bottom center of node)
        const a = state.animNodes[hitId];
        const node = findNode(state.tree, hitId);
        if (a && node && node.article && node.article.content) {
            const bx = a.x, by = a.y + a.r * 0.7;
            if (Math.hypot(wx - bx, wy - by) <= 16) {
                state.focusedId = hitId;
                state.treeVersion++;
                if (typeof openArticleModal === 'function') openArticleModal();
                return;
            }
        }

        if (hitId !== state.focusedId) {
            state.focusedId = hitId; state.deletePending = null; state.treeVersion++;
        }
    }
});

canvas.addEventListener('mouseleave', () => {
    if (state.hoveredId) { state.hoveredId = null; canvas.style.cursor = 'default'; }
});

// ── TOUCH GESTURES ──
let touchStartX = 0, touchStartY = 0, touchStartTime = 0, initialPinchDist = null;
let touchTimer = null, longPressTriggered = false;
function getTouchDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }

canvas.addEventListener('touchstart', (e) => {
    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    e.preventDefault(); 
    longPressTriggered = false;
    if (e.touches.length === 1) { 
        touchStartX = e.touches[0].clientX; 
        touchStartY = e.touches[0].clientY; 
        touchStartTime = Date.now();
        
        if (touchTimer) clearTimeout(touchTimer);
        touchTimer = setTimeout(() => {
            const rect = canvas.getBoundingClientRect();
            const {x: wx, y: wy} = screenToWorld(touchStartX - rect.left, touchStartY - rect.top);
            const hitId = getNodeAtPos(wx, wy);
            if (hitId) {
                longPressTriggered = true;
                state.focusedId = hitId;
                state.deletePending = null;
                state.treeVersion++;
                if ('vibrate' in navigator) navigator.vibrate(40);
                openFloatingNote();
            }
        }, 400);
    }
    else if (e.touches.length === 2) { 
        if (touchTimer) clearTimeout(touchTimer);
        initialPinchDist = getTouchDist(e.touches); 
    }
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    if (state.isEditing || state.isHelpOpen || state.isNoteOpen) return;
    e.preventDefault();
    if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
        const absDx = Math.abs(dx), absDy = Math.abs(dy), threshold = 50; 
        if (absDx > 10 || absDy > 10) {
            if (touchTimer) clearTimeout(touchTimer);
        }
        if (absDx > threshold || absDy > threshold) {
            const isBottomUp = state.layoutDir === 'bottom-up';
            if (absDx > absDy) { navigateSibling(dx > 0 ? -1 : 1); }
            else { ((isBottomUp && dy < -threshold) || (!isBottomUp && dy > threshold)) ? navigateChild() : navigateParent(); }
            touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
        }
    } else if (e.touches.length === 2 && initialPinchDist) {
        if (touchTimer) clearTimeout(touchTimer);
        const currentDist = getTouchDist(e.touches);
        state.targetZoom = clamp(state.targetZoom + (currentDist - initialPinchDist) * 0.005, 0.35, 1.8);
        if (!state.isOverview && state.targetZoom < CONFIG.zoomThreshold) { state.isOverview = true; state.treeVersion++; } 
        else if (state.isOverview && state.targetZoom >= CONFIG.zoomThreshold) { state.isOverview = false; state.treeVersion++; }
        initialPinchDist = currentDist;
    }
}, {passive: false});

let lastTapTime = 0;
canvas.addEventListener('touchend', (e) => {
    if (touchTimer) clearTimeout(touchTimer);
    if (longPressTriggered) {
        longPressTriggered = false;
        initialPinchDist = null;
        return;
    }
    if (state.isEditing || state.isHelpOpen) return;
    if (e.changedTouches.length === 1) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX), dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (dx < 15 && dy < 15 && Date.now() - touchStartTime < 350) {
            const rect = canvas.getBoundingClientRect();
            const {x: wx, y: wy} = screenToWorld(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
            const hitId = getNodeAtPos(wx, wy);
            const now = Date.now();
            if (hitId) {
                if (hitId === state.focusedId && (now - lastTapTime < 350)) {
                    startEditing();
                } else {
                    state.focusedId = hitId;
                    state.deletePending = null;
                    state.treeVersion++;
                }
            }
            lastTapTime = now;
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

const cbNewBtn = document.getElementById('cbNewBtn');
if (cbNewBtn) {
    cbNewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        newMap();
    });
}

const cbSampleBtn = document.getElementById('cbSampleBtn');
if (cbSampleBtn) {
    cbSampleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVis = document.getElementById('samplesMenu').style.display === 'flex' || document.getElementById('samplesMenu').style.display === 'block';
        closeAllDropdowns();
        if (!isVis) toggleSamplesMenu(true);
    });
}

// Samples menu item buttons
document.querySelectorAll('.sample-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        closeAllDropdowns();
        const sampleKey = e.currentTarget.dataset.sample;
        if (sampleKey) loadSampleByCategory(sampleKey);
    });
});

// AI Modal triggers
const cbAiBtn = document.getElementById('cbAiBtn');
if (cbAiBtn) {
    cbAiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        openAiModal();
    });
}

const aiModalClose = document.getElementById('aiModalClose');
if (aiModalClose) aiModalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAiModal();
});

const aiModalOverlay = document.getElementById('aiModalOverlay');
if (aiModalOverlay) {
    aiModalOverlay.addEventListener('click', (e) => {
        if (e.target === aiModalOverlay) closeAiModal();
    });
}

const aiPromptInput = document.getElementById('aiPromptInput');
if (aiPromptInput) {
    aiPromptInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAiModal();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const prompt = aiPromptInput.value;
            if (prompt && prompt.trim()) generateAiMindMap(prompt.trim());
        }
    });
}

const aiGenerateSubmit = document.getElementById('aiGenerateSubmit');
if (aiGenerateSubmit) {
    aiGenerateSubmit.addEventListener('click', (e) => {
        e.stopPropagation();
        const prompt = document.getElementById('aiPromptInput').value;
        if (prompt && prompt.trim()) generateAiMindMap(prompt.trim());
    });
}

// AI prompt suggestion chips
document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const chipEl = e.currentTarget || e.target.closest('.ai-chip');
        const text = chipEl ? chipEl.getAttribute('data-prompt') || chipEl.dataset.prompt : '';
        const input = document.getElementById('aiPromptInput');
        if (text && text.trim()) {
            if (input) input.value = text;
            generateAiMindMap(text.trim());
        }
    });
});

// ── ABOUT MODAL HANDLERS ──
function openAboutModal() {
    closeAllDropdowns();
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) aboutModal.style.display = 'flex';
}

function closeAboutModal() {
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) aboutModal.style.display = 'none';
}

const aboutTriggerBtn = document.getElementById('aboutTriggerBtn');
if (aboutTriggerBtn) {
    aboutTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAboutModal();
    });
}

const aboutModalClose = document.getElementById('aboutModalClose');
if (aboutModalClose) {
    aboutModalClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAboutModal();
    });
}

document.addEventListener('click', (e) => {
    if (e.target && (e.target.closest('.mf-project') || e.target.closest('.mf-title-sub'))) {
        e.stopPropagation();
        openAboutModal();
    }
});

// ── TRIPLE-CLICK / SHIFT-CLICK CACHE PURGE GESTURE ──
let brandClickCount = 0;
let brandClickTimer = null;
document.addEventListener('click', (e) => {
    const logoEl = e.target && e.target.closest('.mf-logo, .brand-logo, .about-version-badge, .mf-version-tag');
    if (logoEl) {
        if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            flushAppCacheAndReload();
            return;
        }
        brandClickCount++;
        clearTimeout(brandClickTimer);
        brandClickTimer = setTimeout(() => { brandClickCount = 0; }, 800);
        if (brandClickCount >= 3) {
            brandClickCount = 0;
            e.preventDefault();
            e.stopPropagation();
            flushAppCacheAndReload();
        }
    }
});

function flushAppCacheAndReload() {
    if (window.showToast) window.showToast('جاري تفريغ التخزين المؤقت وإعادة التحميل...', 'info');
    try {
        sessionStorage.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => reg.unregister());
            });
        }
    } catch (err) { console.error('Cache Flush error:', err); }
    setTimeout(() => {
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?v=' + Date.now();
        window.location.href = cleanUrl;
    }, 400);
}

const aboutModal = document.getElementById('aboutModal');
if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) closeAboutModal();
    });
}

let aboutCurrentLang = 'ar';
const aboutLangBtn = document.getElementById('aboutLangBtn');
if (aboutLangBtn) {
    aboutLangBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        aboutCurrentLang = aboutCurrentLang === 'ar' ? 'en' : 'ar';
        const wrapper = document.getElementById('aboutContentWrapper');
        if (wrapper) wrapper.className = `content-wrapper ${aboutCurrentLang === 'ar' ? 'rtl' : 'ltr'}`;
        
        const d = {
            ar: {
                langBtn: 'EN',
                nodeLabel: 'الفكرة',
                aboutTitle: 'تركيز مطلق على المحتوى',
                aboutDesc: 'صُمم ميتاـفكرة ليتيح لك تنظيم وتوسيع أفكارك بسلاسة ناطقة. نركز على سرعة التفكير وعمق المحتوى بدون خيارات مشتتة أو كثرة نقرات الماوس.',
                c1Text: 'الفكرة والهندسة المعمارية: <strong>علاء البنا (Alaa Banna)</strong>',
                c2Text: 'التطوير البرمجي: <strong>Google Gemini</strong>',
                githubText: 'مشروع مفتوح المصدر (MIT) على GitHub'
            },
            en: {
                langBtn: 'AR',
                nodeLabel: 'Concept',
                aboutTitle: 'Pure Focus on Content',
                aboutDesc: 'Meta-Fikra is designed for seamless, distraction-free mind mapping. We prioritize clarity, deep articles, and fast thinking over bloated options and unnecessary clicks.',
                c1Text: 'Design & Architecture: <strong>Alaa Banna</strong>',
                c2Text: 'Code Engineering: <strong>Google Gemini</strong>',
                githubText: 'Open Source (MIT) on GitHub'
            }
        }[aboutCurrentLang];

        if (d) {
            aboutLangBtn.textContent = d.langBtn;
            const nl = document.getElementById('aboutNodeLabel'); if (nl) nl.textContent = d.nodeLabel;
            const at = document.getElementById('aboutTitleText'); if (at) at.textContent = d.aboutTitle;
            const ad = document.getElementById('aboutDescText'); if (ad) ad.textContent = d.aboutDesc;
            const c1 = document.getElementById('aboutC1Text'); if (c1) c1.innerHTML = d.c1Text;
            const c2 = document.getElementById('aboutC2Text'); if (c2) c2.innerHTML = d.c2Text;
            const gh = document.getElementById('aboutGithubText'); if (gh) gh.textContent = d.githubText;
        }
    });
}

// File and Settings Dropdown Toggles
const cbFileBtn = document.getElementById('cbFileBtn');
const fileMenu = document.getElementById('fileMenu');
if (cbFileBtn && fileMenu) {
    cbFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVis = fileMenu.style.display === 'block';
        closeAllDropdowns();
        fileMenu.style.display = isVis ? 'none' : 'block';
    });
}

const cbSettingsBtn = document.getElementById('cbSettingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
if (cbSettingsBtn && settingsMenu) {
    cbSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVis = settingsMenu.style.display === 'block';
        closeAllDropdowns();
        settingsMenu.style.display = isVis ? 'none' : 'block';
    });
}

document.addEventListener('click', (e) => {
    const samplesMenu = document.getElementById('samplesMenu');
    const cbSampleBtn = document.getElementById('cbSampleBtn');
    const fileMenu = document.getElementById('fileMenu');
    const cbFileBtn = document.getElementById('cbFileBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const cbSettingsBtn = document.getElementById('cbSettingsBtn');
    const cloudDrawer = document.getElementById('cloudMapsDrawer');
    const userAccountBtn = document.getElementById('userAccountBtn');

    const isInsideSample = (samplesMenu && samplesMenu.contains(e.target)) || (cbSampleBtn && cbSampleBtn.contains(e.target));
    const isInsideFile = (fileMenu && fileMenu.contains(e.target)) || (cbFileBtn && cbFileBtn.contains(e.target));
    const isInsideSettings = (settingsMenu && settingsMenu.contains(e.target)) || (cbSettingsBtn && cbSettingsBtn.contains(e.target));
    const isInsideCloud = (cloudDrawer && cloudDrawer.contains(e.target)) || (userAccountBtn && userAccountBtn.contains(e.target));

    if (!isInsideSample && !isInsideFile && !isInsideSettings && !isInsideCloud) {
        closeAllDropdowns();
    }
});

const elExportMt = document.getElementById('cbExportMtBtn');
if (elExportMt) elExportMt.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); exportAsMT(); });

const elUploadMt = document.getElementById('cbUploadMtBtn');
if (elUploadMt) elUploadMt.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); const inp = document.getElementById('mtFileInput'); if (inp) inp.click(); });

const elExportPng = document.getElementById('cbExportPngBtn');
if (elExportPng) elExportPng.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); exportAsPNG(); });

const elDirBtn = document.getElementById('cbDirectionBtn');
if (elDirBtn) elDirBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); toggleLayout(); });

const elFileInput = document.getElementById('mtFileInput');
if (elFileInput) elFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => importMTContent(evt.target.result);
    reader.readAsText(file);
});

// ── SEARCH EVENTS ──
const searchInputEl = document.getElementById('searchInput');
if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => performSearch(e.target.value));
    searchInputEl.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            const list = state.searchMatchList;
            if (list && list.length > 0) {
                if (state.searchMatchIndex === undefined || state.searchMatchIndex < 0) {
                    state.searchMatchIndex = 0;
                }
                const targetId = list[state.searchMatchIndex];
                if (targetId) {
                    state.focusedId = targetId;
                    state.isOverview = false;
                    state.targetZoom = 1.0;
                    state.treeVersion++;
                }
                state.searchMatchIndex = (state.searchMatchIndex + 1) % list.length;
            }
            searchInputEl.blur();
        } else if (e.key === 'Escape') { 
            clearSearch(); 
            searchInputEl.blur(); 
        }
    });
}
const searchCloseBtn = document.getElementById('searchCloseBtn');
if (searchCloseBtn) searchCloseBtn.addEventListener('click', clearSearch);

// ── SIDE ACTION BAR EVENTS ──
const tbAddChild = document.getElementById('tbAddChild');
if (tbAddChild) tbAddChild.addEventListener('click', () => { closeAllDropdowns(); createChild(); });

const tbAddSibling = document.getElementById('tbAddSibling');
if (tbAddSibling) tbAddSibling.addEventListener('click', () => { closeAllDropdowns(); createSibling(); });

const tbEdit = document.getElementById('tbEdit');
if (tbEdit) tbEdit.addEventListener('click', () => { closeAllDropdowns(); startEditing(); });

const tbDelete = document.getElementById('tbDelete');
if (tbDelete) tbDelete.addEventListener('click', () => { closeAllDropdowns(); handleDelete(false); });

const tbUndo = document.getElementById('tbUndo');
if (tbUndo) tbUndo.addEventListener('click', () => { closeAllDropdowns(); undo(); });

const tbRedo = document.getElementById('tbRedo');
if (tbRedo) tbRedo.addEventListener('click', () => { closeAllDropdowns(); redo(); });

// ── TOOLTIP HOVER DISPLAY ──
canvas.addEventListener('mousemove', (e) => {
    if (state.hoveredId) {
        const node = findNode(state.tree, state.hoveredId);
        if (node) {
            const tooltip = document.getElementById('nodeTooltip');
            document.getElementById('tooltipTitle').textContent = node.text || '';
            const tagsEl = document.getElementById('tooltipTags');
            tagsEl.textContent = node.tags && node.tags.length ? `Tags: ${node.tags.join(', ')}` : '';
            tagsEl.style.display = node.tags && node.tags.length ? 'block' : 'none';
            const noteEl = document.getElementById('tooltipNote');
            noteEl.textContent = node.note ? node.note : '';
            noteEl.style.display = node.note ? 'block' : 'none';
            tooltip.style.left = Math.min(e.clientX + 16, window.innerWidth - 330) + 'px';
            tooltip.style.top = Math.min(e.clientY + 16, window.innerHeight - 150) + 'px';
            tooltip.style.display = 'block';
        }
    } else {
        document.getElementById('nodeTooltip').style.display = 'none';
    }
});

// ── DRAG & DROP .MT FILES ──
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => importMTContent(evt.target.result);
        reader.readAsText(file);
    }
});

document.querySelectorAll('#helpBtn, #metaHelpBtn, .help-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        state.isHelpOpen = !state.isHelpOpen;
    });
});

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
    ctx.fillStyle = CONFIG.colors.bg; 
    ctx.fillRect(0, 0, cw, ch);

    // Full-screen background radial glow (unscaled screen space)
    const maxDim = Math.max(cw, ch);
    const grd = ctx.createRadialGradient(cw / 2, ch * 0.5, 0, cw / 2, ch * 0.5, maxDim * 0.75);
    grd.addColorStop(0, CONFIG.colors.bgGlow); 
    grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grd; 
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw/2, ch/2); ctx.scale(state.targetZoom, state.targetZoom); ctx.translate(-cw/2, -ch/2);

    drawOrbits();

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

// ── SIDE BAR COMPLETION TOGGLE ──
const tbToggleComplete = document.getElementById('tbToggleComplete');
if (tbToggleComplete) {
    tbToggleComplete.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCompletionAction();
    });
}

function applyReadOnlyState(isReadOnly) {
    state.isReadOnly = isReadOnly;
    const sideBar = document.getElementById('sideActionBar');
    const noteEl = document.getElementById('floatingNote');
    if (sideBar) sideBar.style.display = isReadOnly ? 'none' : 'flex';
    if (noteEl) noteEl.readOnly = isReadOnly;
}

// ── SHARE LINK ROUTER ──
async function checkShareRoute() {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('s');
    if (!shareId) return;

    try {
        const res = await window.authModule.fetchSharedMap(shareId);
        if (res.map && res.map.content_json) {
            importMTContent(res.map.content_json);
            const banner = document.getElementById('readOnlyBanner');
            const forkBtn = document.getElementById('forkMapBtn');
            if (banner) banner.style.display = 'flex';

            if (!window.currentUser) {
                applyReadOnlyState(true);
                if (forkBtn) {
                    forkBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول لحفظ نسخة';
                    const authModal = document.getElementById('authModal');
                    forkBtn.onclick = () => { if (authModal) authModal.style.display = 'flex'; };
                }
            } else {
                applyReadOnlyState(false);
                if (forkBtn) {
                    forkBtn.innerHTML = '<i class="fa-solid fa-code-fork"></i> حفظ نسخة في حسابي';
                    forkBtn.onclick = async () => {
                        const title = `${res.map.title} (نسخة)`;
                        await window.authModule.saveMap(title, res.map.content_json);
                        if (typeof showToast === 'function') showToast('تم حفظ نسخة الخريطة في حسابك بنجاح!', 'success');
                        window.history.replaceState({}, document.title, window.location.pathname);
                        if (banner) banner.style.display = 'none';
                    };
                }
            }
        }
    } catch(e) {
        console.warn('Failed to load shared map:', e);
    }
}

// ── INIT ──
function init() {
    state.isMobile = window.innerWidth <= 768;
    state.tree = loadFromStorage();
    if (!state.tree || !state.tree.id) {
        state.tree = parseMarkup('root');
    }
    state.focusedId = state.tree ? state.tree.id : null;
    if (typeof applySavedTheme === 'function') applySavedTheme();
    if (typeof applyLanguage === 'function') applyLanguage(window.currentLang);
    resizeCanvas();
    checkShareRoute();
    requestAnimationFrame(render);
}
init();