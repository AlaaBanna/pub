// Version: v8.0.0 | Updated: 2026-08-01 02:22 | Features: Rich Node Articles, Split Markdown Editor with Live Preview, Canvas Eye Indicator Badge, and Reader Modal
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

// ── CLOSE DROPDOWNS HELPER ──
function closeAllDropdowns() {
    document.querySelectorAll('.hdr-dropdown-panel, .samples-popover').forEach(p => p.style.display = 'none');
    const cloudDrawer = document.getElementById('cloudMapsDrawer');
    if (cloudDrawer) cloudDrawer.style.display = 'none';
}

// ── LANGUAGE & TRANSLATIONS ──
window.currentLang = localStorage.getItem('mf_lang') || 'ar';

const TRANSLATIONS = {
    ar: {
        langBtnLabel: '<i class="fa-solid fa-globe"></i> Language / اللغة: العربية',
        themeDarkLight: 'داكن / فاتح',
        shortcutsLabel: 'الاختصارات (؟)',
        cbAiBtnTitle: 'توليد بالذكاء الاصطناعي (Alt+A)',
        cbFileBtnTitle: 'ملف الخريطة',
        cbSampleBtnTitle: 'خرائط ونماذج جاهزة',
        cbDirectionBtnTitle: 'تبديل اتجاه التفرع (G)',
        cbSettingsBtnTitle: 'المظهر والإعدادات',
        searchPlaceholder: 'بحث في الخريطة...',
        newMap: '<i class="fa-solid fa-file-circle-plus"></i> خريطة جديدة',
        openMap: '<i class="fa-solid fa-folder-open"></i> فتح خريطة...',
        saveMap: '<i class="fa-solid fa-floppy-disk"></i> حفظ (.mt)',
        exportPng: '<i class="fa-solid fa-image"></i> تصدير صورة PNG',
        samplesTitle: 'عينات الخرائط الذهنية',
        samplePhilosophy: '<i class="fa-solid fa-brain"></i> فروع الفلسفة والمنطق',
        sampleScience: '<i class="fa-solid fa-microscope"></i> أقسام العلوم الطبيعية والتطبيقية',
        sampleCs: '<i class="fa-solid fa-laptop-code"></i> فروع علوم الحاسوب والذكاء الاصطناعي',
        sampleSoftware: '<i class="fa-solid fa-list-check"></i> تخطيط وإدارة المشاريع البرمجية',
        aiModalTitle: '<i class="fa-solid fa-wand-magic-sparkles"></i> توليد خريطة ذهنية بالذكاء الاصطناعي',
        aiModalDesc: 'أدخل أي موضوع أو فكرة لتوليد خريطة ذهنية هيكلية متكاملة ومزودة بالملاحظات الشارحة تلقائياً:',
        aiPromptPlaceholder: 'مثال: فروع وتخصصات الأمن السيبراني، خطوات إطلاق مشروع برمجي، أقسام العلوم الطبيعية...',
        aiChipsLabel: 'أفكار مقترحة سريعة:',
        aiChip1Text: '🤖 الذكاء الاصطناعي',
        aiChip1Prompt: 'فروع الذكاء الاصطناعي وتطبيقات تعلم الآلة',
        aiChip2Text: '🔬 العلوم والفيزياء',
        aiChip2Prompt: 'أقسام العلوم الطبيعية والفيزياء الحديثة',
        aiChip3Text: '🚀 إطلاق مشروع',
        aiChip3Prompt: 'خطوات إطلاق وتخطيط مشروع برمجي جديد',
        aiChip4Text: '🧠 علم النفس والمنطق',
        aiChip4Prompt: 'فروع علم النفس والتحليل النفسي وتطبيقاته',
        aiChip5Text: '💼 التسويق والأعمال',
        aiChip5Prompt: 'استراتيجيات التسويق الرقمي وبناء العلامة التجارية',
        aiLoading: '<i class="fa-solid fa-circle-notch fa-spin"></i> جاري التوليد والتنظيم الذكي بواسطة Llama 3.3 70B...',
        aiSubmit: '<i class="fa-solid fa-wand-magic-sparkles"></i> توليد الخريطة الذهنية الآن',
        tbAddChild: 'Add Child (Tab)',
        tbAddSibling: 'Add Sibling (Shift+Tab)',
        tbEdit: 'Edit Label (Enter)',
        tbNote: 'Note (N)',
        tbDelete: 'Delete (Del)',
        tbUndo: 'Undo (Ctrl+Z)',
        tbRedo: 'Redo (Ctrl+Y)',
        notePlaceholder: 'إضافة ملاحظة...'
    },
    en: {
        langBtnLabel: '<i class="fa-solid fa-globe"></i> Language / اللغة: English',
        themeDarkLight: 'Light / Dark',
        shortcutsLabel: 'Shortcuts (?)',
        cbAiBtnTitle: 'Generate with AI (Alt+A)',
        cbFileBtnTitle: 'Map File',
        cbSampleBtnTitle: 'Ready Templates & Samples',
        cbDirectionBtnTitle: 'Toggle Branch Direction (G)',
        cbSettingsBtnTitle: 'Appearance & Settings',
        searchPlaceholder: 'Search mind map...',
        newMap: '<i class="fa-solid fa-file-circle-plus"></i> New Map',
        openMap: '<i class="fa-solid fa-folder-open"></i> Open Map...',
        saveMap: '<i class="fa-solid fa-floppy-disk"></i> Save (.mt)',
        exportPng: '<i class="fa-solid fa-image"></i> Export PNG Image',
        samplesTitle: 'Mind Map Samples',
        samplePhilosophy: '<i class="fa-solid fa-brain"></i> Philosophy & Logic Branches',
        sampleScience: '<i class="fa-solid fa-microscope"></i> Natural & Applied Sciences',
        sampleCs: '<i class="fa-solid fa-laptop-code"></i> Computer Science & AI',
        sampleSoftware: '<i class="fa-solid fa-list-check"></i> Software Project Management',
        aiModalTitle: '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Mind Map',
        aiModalDesc: 'Enter any topic or concept to generate a structured mind map complete with explanatory notes:',
        aiPromptPlaceholder: 'Example: Cybersecurity branches, software project launch steps, natural sciences...',
        aiChipsLabel: 'Suggested Quick Ideas:',
        aiChip1Text: '🤖 Artificial Intelligence',
        aiChip1Prompt: 'Branches of Artificial Intelligence and Machine Learning applications',
        aiChip2Text: '🔬 Science & Physics',
        aiChip2Prompt: 'Branches of Natural Sciences and Modern Physics',
        aiChip3Text: '🚀 Launch Project',
        aiChip3Prompt: 'Steps to launch and plan a new software project',
        aiChip4Text: '🧠 Psychology & Logic',
        aiChip4Prompt: 'Branches of Psychology, Psychoanalysis, and its applications',
        aiChip5Text: '💼 Marketing & Business',
        aiChip5Prompt: 'Digital marketing strategies and brand building',
        aiLoading: '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating smart mind map via Llama 3.3 70B...',
        aiSubmit: '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Mind Map Now',
        tbAddChild: 'Add Child (Tab)',
        tbAddSibling: 'Add Sibling (Shift+Tab)',
        tbEdit: 'Edit Label (Enter)',
        tbNote: 'Note (N)',
        tbDelete: 'Delete (Del)',
        tbUndo: 'Undo (Ctrl+Z)',
        tbRedo: 'Redo (Ctrl+Y)',
        notePlaceholder: 'Add note...'
    }
};

window.toggleLanguage = function() {
    closeAllDropdowns();
    window.currentLang = (window.currentLang === 'ar') ? 'en' : 'ar';
    localStorage.setItem('mf_lang', window.currentLang);
    applyLanguage(window.currentLang);
};

function applyLanguage(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    
    if (lang === 'en') {
        document.body.classList.add('lang-en');
        const aiModalOverlay = document.getElementById('aiModalOverlay');
        if (aiModalOverlay) aiModalOverlay.setAttribute('dir', 'ltr');
    } else {
        document.body.classList.remove('lang-en');
        const aiModalOverlay = document.getElementById('aiModalOverlay');
        if (aiModalOverlay) aiModalOverlay.setAttribute('dir', 'rtl');
    }

    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        const label = langBtn.querySelector('.item-label');
        if (label) label.innerHTML = t.langBtnLabel;
    }

    const isLight = document.body.classList.contains('light-mode');
    const themeBtn = document.getElementById('cbThemeBtn') || document.getElementById('mfThemeBtn');
    if (themeBtn) {
        const iconName = isLight ? 'fa-sun' : 'fa-moon';
        themeBtn.innerHTML = `<span class="item-label"><i class="fa-solid ${iconName}"></i> ${t.themeDarkLight}</span>`;
    }

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        const label = helpBtn.querySelector('.item-label');
        if (label) label.innerHTML = `<i class="fa-solid fa-keyboard"></i> ${t.shortcutsLabel}`;
    }

    const cbAiBtn = document.getElementById('cbAiBtn'); if (cbAiBtn) cbAiBtn.title = t.cbAiBtnTitle;
    const cbFileBtn = document.getElementById('cbFileBtn'); if (cbFileBtn) cbFileBtn.title = t.cbFileBtnTitle;
    const cbSampleBtn = document.getElementById('cbSampleBtn'); if (cbSampleBtn) cbSampleBtn.title = t.cbSampleBtnTitle;
    const cbDirectionBtn = document.getElementById('cbDirectionBtn'); if (cbDirectionBtn) cbDirectionBtn.title = t.cbDirectionBtnTitle;
    const cbSettingsBtn = document.getElementById('cbSettingsBtn'); if (cbSettingsBtn) cbSettingsBtn.title = t.cbSettingsBtnTitle;

    const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    const cbNewBtn = document.getElementById('cbNewBtn'); if (cbNewBtn) { const l = cbNewBtn.querySelector('.item-label'); if (l) l.innerHTML = t.newMap; }
    const cbUploadMtBtn = document.getElementById('cbUploadMtBtn'); if (cbUploadMtBtn) { const l = cbUploadMtBtn.querySelector('.item-label'); if (l) l.innerHTML = t.openMap; }
    const cbExportMtBtn = document.getElementById('cbExportMtBtn'); if (cbExportMtBtn) { const l = cbExportMtBtn.querySelector('.item-label'); if (l) l.innerHTML = t.saveMap; }
    const cbExportPngBtn = document.getElementById('cbExportPngBtn'); if (cbExportPngBtn) { const l = cbExportPngBtn.querySelector('.item-label'); if (l) l.innerHTML = t.exportPng; }

    const samplesTitle = document.querySelector('.samples-title'); if (samplesTitle) samplesTitle.textContent = t.samplesTitle;
    const sampleBtns = document.querySelectorAll('.sample-item-btn');
    if (sampleBtns.length >= 4) {
        sampleBtns[0].innerHTML = t.samplePhilosophy;
        sampleBtns[1].innerHTML = t.sampleScience;
        sampleBtns[2].innerHTML = t.sampleCs;
        sampleBtns[3].innerHTML = t.sampleSoftware;
    }

    const aiTitle = document.querySelector('.ai-modal-title'); if (aiTitle) aiTitle.innerHTML = t.aiModalTitle;
    const aiDesc = document.querySelector('.ai-modal-desc'); if (aiDesc) aiDesc.textContent = t.aiModalDesc;
    const aiInput = document.getElementById('aiPromptInput');
    if (aiInput) {
        aiInput.placeholder = t.aiPromptPlaceholder;
        aiInput.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
        aiInput.style.direction = lang === 'en' ? 'ltr' : 'rtl';
        aiInput.style.textAlign = lang === 'en' ? 'left' : 'right';
    }
    const aiChipsLabel = document.querySelector('.ai-chips-label'); if (aiChipsLabel) aiChipsLabel.textContent = t.aiChipsLabel;
    
    const chips = document.querySelectorAll('.ai-chip');
    if (chips.length >= 5) {
        chips[0].textContent = t.aiChip1Text; chips[0].dataset.prompt = t.aiChip1Prompt;
        chips[1].textContent = t.aiChip2Text; chips[1].dataset.prompt = t.aiChip2Prompt;
        chips[2].textContent = t.aiChip3Text; chips[2].dataset.prompt = t.aiChip3Prompt;
        chips[3].textContent = t.aiChip4Text; chips[3].dataset.prompt = t.aiChip4Prompt;
        chips[4].textContent = t.aiChip5Text; chips[4].dataset.prompt = t.aiChip5Prompt;
    }
    const aiLoading = document.getElementById('aiLoading'); if (aiLoading) aiLoading.innerHTML = t.aiLoading;
    const aiSubmit = document.getElementById('aiGenerateSubmit'); if (aiSubmit) aiSubmit.innerHTML = t.aiSubmit;

    const tbAddChild = document.getElementById('tbAddChild'); if (tbAddChild) tbAddChild.title = t.tbAddChild;
    const tbAddSibling = document.getElementById('tbAddSibling'); if (tbAddSibling) tbAddSibling.title = t.tbAddSibling;
    const tbEdit = document.getElementById('tbEdit'); if (tbEdit) tbEdit.title = t.tbEdit;
    const tbNote = document.getElementById('tbNote'); if (tbNote) tbNote.title = t.tbNote;
    const tbDelete = document.getElementById('tbDelete'); if (tbDelete) tbDelete.title = t.tbDelete;
    const tbUndo = document.getElementById('tbUndo'); if (tbUndo) tbUndo.title = t.tbUndo;
    const tbRedo = document.getElementById('tbRedo'); if (tbRedo) tbRedo.title = t.tbRedo;

    const floatingNote = document.getElementById('floatingNote'); if (floatingNote) floatingNote.placeholder = t.notePlaceholder;

    if (window.state) window.state.treeVersion++;
}

// ── THEME ──
function updateThemeBtnIcon(isLight) {
    const themeBtn = document.getElementById('cbThemeBtn') || document.getElementById('mfThemeBtn');
    if (themeBtn) {
        const t = TRANSLATIONS[window.currentLang] || TRANSLATIONS.ar;
        const iconName = isLight ? 'fa-sun' : 'fa-moon';
        themeBtn.innerHTML = `<span class="item-label"><i class="fa-solid ${iconName}"></i> ${t.themeDarkLight}</span>`;
    }
}
window.mfToggleTheme = function() {
    closeAllDropdowns();
    const isLight = document.body.classList.toggle('light-mode');
    CONFIG.colors = isLight ? THEMES.light : THEMES.dark;
    updateThemeBtnIcon(isLight);
    state.treeVersion++;
    localStorage.setItem('mf_theme', isLight ? 'light' : 'dark');
};
function applySavedTheme() {
    const saved = localStorage.getItem('mf_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        CONFIG.colors = THEMES.light;
        updateThemeBtnIcon(true);
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

// ── MOUSE ──
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
                openArticleModal();
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

// ── TOUCH ──
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

document.getElementById('cbNewBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    newMap();
});
document.getElementById('cbSampleBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const isVis = document.getElementById('samplesMenu').style.display === 'flex' || document.getElementById('samplesMenu').style.display === 'block';
    closeAllDropdowns();
    if (!isVis) toggleSamplesMenu(true);
});

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
if (cbAiBtn) cbAiBtn.addEventListener('click', () => {
    closeAllDropdowns();
    openAiModal();
});

const aiModalClose = document.getElementById('aiModalClose');
if (aiModalClose) aiModalClose.addEventListener('click', closeAiModal);

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
    aiGenerateSubmit.addEventListener('click', () => {
        const prompt = document.getElementById('aiPromptInput').value;
        if (prompt && prompt.trim()) generateAiMindMap(prompt.trim());
    });
}

// AI prompt suggestion chips
document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        const text = e.target.dataset.prompt;
        const input = document.getElementById('aiPromptInput');
        if (input && text) {
            input.value = text;
            input.focus();
        }
    });
});

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

document.getElementById('cbExportMtBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    exportAsMT();
});
document.getElementById('cbUploadMtBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    document.getElementById('mtFileInput').click();
});
document.getElementById('cbExportPngBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    exportAsPNG();
});
document.getElementById('cbDirectionBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    toggleLayout();
});
document.getElementById('mtFileInput').addEventListener('change', (e) => {
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
const closeBtn = document.getElementById('searchCloseBtn');
if (closeBtn) closeBtn.addEventListener('click', clearSearch);

// ── SIDE ACTION BAR EVENTS ──
document.getElementById('tbAddChild').addEventListener('click', () => { closeAllDropdowns(); createChild(); });
document.getElementById('tbAddSibling').addEventListener('click', () => { closeAllDropdowns(); createSibling(); });
document.getElementById('tbEdit').addEventListener('click', () => { closeAllDropdowns(); startEditing(); });
document.getElementById('tbNote').addEventListener('click', () => { closeAllDropdowns(); openFloatingNote(); });
document.getElementById('tbDelete').addEventListener('click', () => { closeAllDropdowns(); handleDelete(false); });
document.getElementById('tbUndo').addEventListener('click', () => { closeAllDropdowns(); undo(); });
document.getElementById('tbRedo').addEventListener('click', () => { closeAllDropdowns(); redo(); });

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

// ── RICH NODE ARTICLE CONTROLLER ──
const tbArticle = document.getElementById('tbArticle');
if (tbArticle) {
    tbArticle.addEventListener('click', (e) => {
        e.stopPropagation();
        openArticleModal();
    });
}

function renderMarkdownText(mdText) {
    if (typeof marked !== 'undefined' && marked.parse) {
        return marked.parse(mdText || '');
    }
    return (mdText || '').replace(/\n/g, '<br>');
}

window.openArticleModal = function() {
    if (!state.focusedId) return;
    const node = findNode(state.tree, state.focusedId);
    if (!node) return;

    const modal = document.getElementById('articleModal');
    const breadcrumb = document.getElementById('articleBreadcrumb');
    const titleEl = document.getElementById('articleTitle');
    const bodyContent = document.getElementById('articleBodyContent');
    const emptyNotice = document.getElementById('articleEmptyNotice');
    const readerPane = document.getElementById('articleReaderPane');
    const editorPane = document.getElementById('articleEditorPane');

    const parentNode = findParent(state.tree, state.focusedId, null);
    if (breadcrumb) breadcrumb.textContent = parentNode ? parentNode.text : (state.tree.text || 'الخريطة الرئيسية');
    if (titleEl) titleEl.textContent = node.text || 'العقدة';

    updateArticleReadStatusUI(node);

    if (editorPane) editorPane.style.display = 'none';
    if (readerPane) readerPane.style.display = 'block';

    const articleContent = (node.article && node.article.content) ? node.article.content.trim() : '';
    if (articleContent) {
        if (bodyContent) {
            bodyContent.innerHTML = renderMarkdownText(articleContent);
            bodyContent.style.display = 'block';
        }
        if (emptyNotice) emptyNotice.style.display = 'none';
    } else {
        if (bodyContent) bodyContent.style.display = 'none';
        if (emptyNotice) emptyNotice.style.display = 'block';
    }

    if (modal) modal.style.display = 'flex';
};

function updateArticleReadStatusUI(node) {
    const statusBtn = document.getElementById('articleReadStatusBtn');
    if (!statusBtn) return;
    const isRead = node && node.article && node.article.isRead;
    if (isRead) {
        statusBtn.className = 'read-status-pill read';
        statusBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> مقروء';
    } else {
        statusBtn.className = 'read-status-pill unread';
        statusBtn.innerHTML = '<i class="fa-regular fa-circle"></i> غير مقروء';
    }
}

window.toggleCurrentArticleRead = function() {
    if (!state.focusedId) return;
    const isRead = toggleArticleReadStatus(state.tree, state.focusedId);
    const node = findNode(state.tree, state.focusedId);
    updateArticleReadStatusUI(node);
    state.treeVersion++;
    saveToStorage();
};

const articleReadStatusBtn = document.getElementById('articleReadStatusBtn');
if (articleReadStatusBtn) articleReadStatusBtn.addEventListener('click', toggleCurrentArticleRead);

const articleCloseBtn = document.getElementById('articleCloseBtn');
if (articleCloseBtn) articleCloseBtn.addEventListener('click', () => {
    const modal = document.getElementById('articleModal');
    if (modal) modal.style.display = 'none';
});

function openSplitEditor() {
    if (state.isReadOnly) {
        showToast('لا يمكنك تعديل الخريطة في وضع القراءة فقط', 'info');
        return;
    }
    const node = findNode(state.tree, state.focusedId);
    if (!node) return;

    const readerPane = document.getElementById('articleReaderPane');
    const editorPane = document.getElementById('articleEditorPane');
    const mdInput = document.getElementById('articleMarkdownInput');
    const preview = document.getElementById('articleLivePreview');

    const content = (node.article && node.article.content) ? node.article.content : '';
    if (mdInput) mdInput.value = content;
    if (preview) preview.innerHTML = renderMarkdownText(content);

    if (readerPane) readerPane.style.display = 'none';
    if (editorPane) editorPane.style.display = 'flex';
}

const createArticleBtn = document.getElementById('createArticleBtn');
const authorEditHint = document.getElementById('authorEditHint');
if (createArticleBtn) createArticleBtn.addEventListener('click', openSplitEditor);
if (authorEditHint) authorEditHint.addEventListener('click', openSplitEditor);

const mdInputEl = document.getElementById('articleMarkdownInput');
if (mdInputEl) {
    mdInputEl.addEventListener('input', () => {
        const preview = document.getElementById('articleLivePreview');
        if (preview) preview.innerHTML = renderMarkdownText(mdInputEl.value);
    });
}

const saveArticleBtn = document.getElementById('saveArticleBtn');
if (saveArticleBtn) {
    saveArticleBtn.addEventListener('click', () => {
        if (!state.focusedId) return;
        const content = mdInputEl ? mdInputEl.value : '';
        setNodeArticle(state.tree, state.focusedId, content);
        state.treeVersion++;
        saveToStorage();
        showToast('تم حفظ المقال بنجاح!', 'success');
        openArticleModal();
    });
}

const deleteArticleBtn = document.getElementById('deleteArticleBtn');
if (deleteArticleBtn) {
    deleteArticleBtn.addEventListener('click', () => {
        if (!confirm('هل أنت تأكد من رغبتك في حذف مقال هذه العقدة؟')) return;
        setNodeArticle(state.tree, state.focusedId, '');
        state.treeVersion++;
        saveToStorage();
        showToast('تم حذف المقال بنجاح', 'info');
        openArticleModal();
    });
}

const cancelArticleEditBtn = document.getElementById('cancelArticleEditBtn');
if (cancelArticleEditBtn) {
    cancelArticleEditBtn.addEventListener('click', openArticleModal);
}

// ── AUTH MODAL & CLOUD STORAGE EVENTS ──
const userAccountBtn = document.getElementById('userAccountBtn');
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');

if (userAccountBtn && authModal) {
    userAccountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.currentUser) {
            openCloudDrawer();
        } else {
            authModal.style.display = 'flex';
        }
    });
}

if (authModalClose && authModal) {
    authModalClose.addEventListener('click', () => authModal.style.display = 'none');
}

const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errEl = document.getElementById('authErrorMsg');
        if (errEl) errEl.style.display = 'none';

        try {
            await window.authModule.login(email, password);
            if (authModal) authModal.style.display = 'none';
        } catch(err) {
            if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const errEl = document.getElementById('authErrorMsg');
        if (errEl) errEl.style.display = 'none';

        try {
            await window.authModule.register(email, name, password);
            if (authModal) authModal.style.display = 'none';
        } catch(err) {
            if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        }
    });
}

window.handleGoogleAuthCallback = async function(response) {
    try {
        await window.authModule.googleAuth(response.credential);
        if (authModal) authModal.style.display = 'none';
    } catch(err) {
        const errEl = document.getElementById('authErrorMsg');
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    }
};

// ── CLOUD MAPS DRAWER EVENTS ──
const cloudMapsBtn = document.getElementById('cloudMapsBtn');
const cloudMapsDrawer = document.getElementById('cloudMapsDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

async function openCloudDrawer() {
    if (!window.currentUser) {
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    if (cloudMapsDrawer) cloudMapsDrawer.style.display = 'flex';
    await refreshCloudMapsList();
}

if (cloudMapsBtn) cloudMapsBtn.addEventListener('click', openCloudDrawer);
if (closeDrawerBtn && cloudMapsDrawer) closeDrawerBtn.addEventListener('click', () => cloudMapsDrawer.style.display = 'none');

async function refreshCloudMapsList() {
    const listEl = document.getElementById('cloudMapsList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="color:var(--text-dim); font-size:12px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading maps...</div>';

    try {
        const res = await window.authModule.fetchUserMaps();
        if (!res.maps || res.maps.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text-dim); font-size:12px;">No cloud maps saved yet.</div>';
            return;
        }

        listEl.innerHTML = res.maps.map(m => `
            <div class="cloud-map-item">
                <div class="cloud-map-info">
                    <div class="cloud-map-title">${m.title}</div>
                    <div class="cloud-map-date">${new Date(m.updated_at).toLocaleDateString()}</div>
                </div>
                <div class="cloud-map-actions">
                    <button class="cloud-action-btn" onclick="openCloudMap('${m.id}')"><i class="fa-solid fa-folder-open"></i></button>
                    <button class="cloud-action-btn" onclick="shareCloudMap('${m.share_id}')"><i class="fa-solid fa-share-nodes"></i></button>
                    <button class="cloud-action-btn" onclick="deleteCloudMap('${m.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch(err) {
        listEl.innerHTML = `<div style="color:#ef4444; font-size:12px;">${err.message}</div>`;
    }
}

window.openCloudMap = async function(id) {
    try {
        const res = await window.authModule.fetchMapById(id);
        if (res.map && res.map.content_json) {
            importMTContent(res.map.content_json);
            closeAllDropdowns();
        }
    } catch(e) {
        console.error('Error opening cloud map:', e);
    }
};

window.shareCloudMap = function(shareId) {
    closeAllDropdowns();
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${shareId}`;
    const shareModal = document.getElementById('shareModal');
    const shareUrlInput = document.getElementById('shareUrlInput');
    const shareToast = document.getElementById('shareToast');

    if (shareUrlInput) shareUrlInput.value = shareUrl;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        if (shareToast) shareToast.style.display = 'flex';
    }).catch(() => {
        if (shareToast) shareToast.style.display = 'none';
    });

    if (shareModal) shareModal.style.display = 'flex';
};

const shareModalClose = document.getElementById('shareModalClose');
if (shareModalClose) {
    shareModalClose.addEventListener('click', () => {
        const shareModal = document.getElementById('shareModal');
        if (shareModal) shareModal.style.display = 'none';
    });
}

const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
if (copyShareUrlBtn) {
    copyShareUrlBtn.addEventListener('click', () => {
        const shareUrlInput = document.getElementById('shareUrlInput');
        const shareToast = document.getElementById('shareToast');
        if (shareUrlInput) {
            shareUrlInput.select();
            navigator.clipboard.writeText(shareUrlInput.value).then(() => {
                if (shareToast) shareToast.style.display = 'flex';
            });
        }
    });
};

// ── APP TOAST SYSTEM ──
window.showToast = function(msg, type = 'success', duration = 3000) {
    const toast = document.getElementById('appToast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.className = `app-toast ${type}`;
    if (type === 'success') toastIcon.className = 'fa-solid fa-circle-check';
    else if (type === 'error') toastIcon.className = 'fa-solid fa-circle-exclamation';
    else toastIcon.className = 'fa-solid fa-circle-info';

    toast.style.display = 'flex';
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
};

window.deleteCloudMap = async function(id) {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذه الخريطة السحابية؟')) return;
    try {
        await window.authModule.deleteMap(id);
        await refreshCloudMapsList();
        showToast('تم حذف الخريطة السحابية', 'info');
    } catch(e) {
        showToast(e.message, 'error');
    }
};

const saveCurrentToCloudBtn = document.getElementById('saveCurrentToCloudBtn');
if (saveCurrentToCloudBtn) {
    saveCurrentToCloudBtn.addEventListener('click', async () => {
        if (!state.tree) return;
        const title = state.tree.text || 'Mind Map';
        const contentJson = serializeMT(state.tree);
        try {
            await window.authModule.saveMap(title, contentJson);
            await refreshCloudMapsList();
            showToast('تم حفظ الخريطة سحابياً بنجاح!', 'success');
        } catch(err) {
            showToast(err.message, 'error');
        }
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
                    forkBtn.onclick = () => { if (authModal) authModal.style.display = 'flex'; };
                }
            } else {
                applyReadOnlyState(false);
                if (forkBtn) {
                    forkBtn.innerHTML = '<i class="fa-solid fa-code-fork"></i> حفظ نسخة في حسابي';
                    forkBtn.onclick = async () => {
                        const title = `${res.map.title} (نسخة)`;
                        await window.authModule.saveMap(title, res.map.content_json);
                        showToast('تم حفظ نسخة الخريطة في حسابك بنجاح!', 'success');
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
    state.tree = loadFromStorage() || parseMarkup(DEFAULT_SAMPLE_MARKUP);
    state.focusedId = state.tree.id;
    applySavedTheme();
    applyLanguage(window.currentLang);
    resizeCanvas();
    checkShareRoute();
    requestAnimationFrame(render);
}
init();