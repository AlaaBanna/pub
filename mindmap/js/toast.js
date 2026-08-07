// Version: v1.0.0 | Updated: 2026-08-07 | Features: App Toast Notification System
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
