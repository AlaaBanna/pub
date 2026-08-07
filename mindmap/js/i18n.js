// Version: v1.0.0 | Updated: 2026-08-07 | Features: Internationalization & Theme Switcher Module

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
    if (typeof window.closeAllModalsAndPanels === 'function') window.closeAllModalsAndPanels();
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
    if (typeof window.closeAllModalsAndPanels === 'function') window.closeAllModalsAndPanels();
    const isLight = document.body.classList.toggle('light-mode');
    if (typeof CONFIG !== 'undefined' && typeof THEMES !== 'undefined') {
        CONFIG.colors = isLight ? THEMES.light : THEMES.dark;
    }
    updateThemeBtnIcon(isLight);
    if (window.state) window.state.treeVersion++;
    localStorage.setItem('mf_theme', isLight ? 'light' : 'dark');
};

function applySavedTheme() {
    const saved = localStorage.getItem('mf_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        if (typeof CONFIG !== 'undefined' && typeof THEMES !== 'undefined') {
            CONFIG.colors = THEMES.light;
        }
        updateThemeBtnIcon(true);
    }
}
