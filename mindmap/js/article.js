// Version: v1.0.0 | Updated: 2026-08-07 | Features: Rich Markdown Article Reader & EasyMDE Editor Module

let easyMDEInstance = null;

function getEasyMDE() {
    if (!easyMDEInstance && typeof EasyMDE !== 'undefined') {
        const textarea = document.getElementById('articleEasyMDEInput');
        if (textarea) {
            easyMDEInstance = new EasyMDE({
                element: textarea,
                spellChecker: false,
                autosave: { enabled: false },
                status: false,
                direction: 'rtl',
                placeholder: 'اكتب المقال والتفاصيل هنا باستخدام المنسق الموحد...',
                toolbar: [
                    'bold', 'italic', 'heading', '|',
                    'quote', 'code', 'unordered-list', 'ordered-list', '|',
                    'link', 'image', 'table', '|',
                    'preview', 'side-by-side', 'fullscreen', '|',
                    'undo', 'redo'
                ]
            });
        }
    }
    return easyMDEInstance;
}

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
    const authorEditHint = document.getElementById('authorEditHint');
    const createArticleBtn = document.getElementById('createArticleBtn');

    const parentNode = findParent(state.tree, state.focusedId, null);
    if (breadcrumb) breadcrumb.textContent = parentNode ? parentNode.text : (state.tree.text || 'الخريطة الرئيسية');
    if (titleEl) titleEl.textContent = node.text || 'العقدة';

    updateArticleReadStatusUI(node);

    if (editorPane) editorPane.style.display = 'none';
    if (readerPane) readerPane.style.display = 'block';

    // Hide edit controls in read-only mode for non-logged-in visitors
    if (state.isReadOnly) {
        if (authorEditHint) authorEditHint.style.display = 'none';
        if (createArticleBtn) createArticleBtn.style.display = 'none';
    } else {
        if (authorEditHint) authorEditHint.style.display = 'inline-block';
        if (createArticleBtn) createArticleBtn.style.display = 'inline-block';
    }

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
    const isRead = node ? isArticleRead(node.id) : false;
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

window.closeArticleModal = function() {
    const modal = document.getElementById('articleModal');
    if (modal) modal.style.display = 'none';
};

const articleCloseBtn = document.getElementById('articleCloseBtn');
if (articleCloseBtn) articleCloseBtn.addEventListener('click', closeArticleModal);

function openSingleBoxEditor() {
    if (state.isReadOnly) {
        if (typeof showToast === 'function') showToast('لا يمكنك تعديل الخريطة في وضع القراءة فقط', 'info');
        return;
    }
    const node = findNode(state.tree, state.focusedId);
    if (!node) return;

    const readerPane = document.getElementById('articleReaderPane');
    const editorPane = document.getElementById('articleEditorPane');

    if (readerPane) readerPane.style.display = 'none';
    if (editorPane) editorPane.style.display = 'block';

    const content = (node.article && node.article.content) ? node.article.content : '';
    const mde = getEasyMDE();
    if (mde) {
        mde.value(content);
        setTimeout(() => mde.codemirror.refresh(), 50);
    }
}

const createArticleBtn = document.getElementById('createArticleBtn');
const authorEditHint = document.getElementById('authorEditHint');
if (createArticleBtn) createArticleBtn.addEventListener('click', openSingleBoxEditor);
if (authorEditHint) authorEditHint.addEventListener('click', openSingleBoxEditor);

const saveArticleBtn = document.getElementById('saveArticleBtn');
if (saveArticleBtn) {
    saveArticleBtn.addEventListener('click', async () => {
        if (!state.focusedId) return;
        const mde = getEasyMDE();
        const content = mde ? mde.value() : '';
        setNodeArticle(state.tree, state.focusedId, content);
        state.treeVersion++;
        saveToStorage();

        // Auto sync with Cloudflare D1 database if user is logged in
        if (window.currentUser) {
            const title = state.activeCloudMapTitle || state.tree.text || 'Mind Map';
            const contentJson = serializeMT(state.tree);
            try {
                const res = await window.authModule.saveMap(title, contentJson, state.activeCloudMapId);
                if (res && res.map && res.map.id) {
                    state.activeCloudMapId = res.map.id;
                }
            } catch(e) {
                console.warn('Auto cloud sync failed:', e);
            }
        }

        if (typeof showToast === 'function') showToast('تم حفظ المقال سحابياً بنجاح!', 'success');
        openArticleModal();
    });
}

const deleteArticleBtn = document.getElementById('deleteArticleBtn');
if (deleteArticleBtn) {
    deleteArticleBtn.addEventListener('click', async () => {
        if (!confirm('هل أنت تأكد من رغبتك في حذف مقال هذه العقدة؟')) return;
        setNodeArticle(state.tree, state.focusedId, '');
        state.treeVersion++;
        saveToStorage();

        if (window.currentUser) {
            const title = state.activeCloudMapTitle || state.tree.text || 'Mind Map';
            const contentJson = serializeMT(state.tree);
            try {
                await window.authModule.saveMap(title, contentJson, state.activeCloudMapId);
            } catch(e) {
                console.warn('Auto cloud sync failed:', e);
            }
        }

        if (typeof showToast === 'function') showToast('تم حذف المقال بنجاح', 'info');
        openArticleModal();
    });
}

const cancelArticleEditBtn = document.getElementById('cancelArticleEditBtn');
if (cancelArticleEditBtn) {
    cancelArticleEditBtn.addEventListener('click', openArticleModal);
}
