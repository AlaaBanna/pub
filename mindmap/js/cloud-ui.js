// Version: v1.0.0 | Updated: 2026-08-07 | Features: Auth Modal & Cloud Storage Drawer Controller

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
            state.activeCloudMapId = res.map.id;
            state.activeCloudMapTitle = res.map.title;
            importMTContent(res.map.content_json);
            if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
            else if (typeof window.closeAllModalsAndPanels === 'function') window.closeAllModalsAndPanels();
            if (typeof showToast === 'function') showToast(`تم فتح الخريطة السحابية "${res.map.title}"`, 'info');
        }
    } catch(e) {
        console.error('Error opening cloud map:', e);
    }
};

window.shareCloudMap = function(shareId) {
    if (typeof closeAllDropdowns === 'function') closeAllDropdowns();
    else if (typeof window.closeAllModalsAndPanels === 'function') window.closeAllModalsAndPanels();

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

window.deleteCloudMap = async function(id) {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذه الخريطة السحابية؟')) return;
    try {
        await window.authModule.deleteMap(id);
        await refreshCloudMapsList();
        if (typeof showToast === 'function') showToast('تم حذف الخريطة السحابية', 'info');
    } catch(e) {
        if (typeof showToast === 'function') showToast(e.message, 'error');
    }
};

const saveCurrentToCloudBtn = document.getElementById('saveCurrentToCloudBtn');
if (saveCurrentToCloudBtn) {
    saveCurrentToCloudBtn.addEventListener('click', async () => {
        if (!state.tree) return;
        const title = state.activeCloudMapTitle || state.tree.text || 'Mind Map';
        const contentJson = serializeMT(state.tree);
        try {
            const res = await window.authModule.saveMap(title, contentJson, state.activeCloudMapId);
            if (res && res.map && res.map.id) {
                state.activeCloudMapId = res.map.id;
            }
            await refreshCloudMapsList();
            if (typeof showToast === 'function') showToast('تم حفظ الخريطة والمقالات سحابياً بنجاح!', 'success');
        } catch(err) {
            if (typeof showToast === 'function') showToast(err.message, 'error');
        }
    });
}

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
}
