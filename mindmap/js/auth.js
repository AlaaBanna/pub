// Version: v1.0.0 | Created: 2026-08-01 | Client Authentication & Cloud Sync Module
(function() {
    window.currentUser = null;
    window.jwtToken = localStorage.getItem('mf_jwt') || null;

    function getApiUrl() {
        return 'https://metafikra-mindmap-ai.alaabanna.workers.dev';
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (window.jwtToken) {
            headers['Authorization'] = `Bearer ${window.jwtToken}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${getApiUrl()}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Server request failed.');
        }
        return data;
    }

    window.authModule = {
        getApiUrl,
        apiRequest,

        setSession(token, user) {
            window.jwtToken = token;
            window.currentUser = user;
            if (token && user) {
                localStorage.setItem('mf_jwt', token);
                localStorage.setItem('mf_user', JSON.stringify(user));
            } else {
                localStorage.removeItem('mf_jwt');
                localStorage.removeItem('mf_user');
            }
            window.authModule.updateUserUI();
        },

        logout() {
            window.authModule.setSession(null, null);
            window.location.reload();
        },

        updateUserUI() {
            const userBtn = document.getElementById('userAccountBtn');
            if (!userBtn) return;
            if (window.currentUser) {
                userBtn.innerHTML = `<i class="fa-solid fa-user-check" style="color:#e2b714;"></i>`;
                userBtn.classList.add('logged-in');
                userBtn.title = `Logged in as ${window.currentUser.name} (${window.currentUser.email})`;
            } else {
                userBtn.innerHTML = `<i class="fa-solid fa-user-circle"></i>`;
                userBtn.classList.remove('logged-in');
                userBtn.title = `Login / Sign Up`;
            }
        },

        async register(email, name, password) {
            const res = await apiRequest('/api/auth/register', 'POST', { email, name, password });
            if (res.token && res.user) {
                window.authModule.setSession(res.token, res.user);
            }
            return res;
        },

        async login(email, password) {
            const res = await apiRequest('/api/auth/login', 'POST', { email, password });
            if (res.token && res.user) {
                window.authModule.setSession(res.token, res.user);
            }
            return res;
        },

        async googleAuth(credential) {
            const res = await apiRequest('/api/auth/google', 'POST', { credential });
            if (res.token && res.user) {
                window.authModule.setSession(res.token, res.user);
            }
            return res;
        },

        async fetchUserMaps() {
            return await apiRequest('/api/maps', 'GET');
        },

        async fetchMapById(mapId) {
            return await apiRequest(`/api/maps/${mapId}`, 'GET');
        },

        async saveMap(title, contentJson, id = null) {
            return await apiRequest('/api/maps', 'POST', { id, title, content_json: contentJson });
        },

        async deleteMap(mapId) {
            return await apiRequest(`/api/maps/${mapId}`, 'DELETE');
        },

        async fetchSharedMap(shareId) {
            return await apiRequest(`/api/share/${shareId}`, 'GET');
        },

        init() {
            const token = localStorage.getItem('mf_jwt');
            const savedUserStr = localStorage.getItem('mf_user');

            if (token && savedUserStr) {
                try {
                    window.jwtToken = token;
                    window.currentUser = JSON.parse(savedUserStr);

                    // Validate JWT expiration safely without failing on UTF-8 encoding
                    const base64Payload = token.split('.')[1];
                    if (base64Payload) {
                        const jsonStr = decodeURIComponent(escape(atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))));
                        const payload = JSON.parse(jsonStr);
                        if (payload && payload.exp && (Date.now() / 1000 > payload.exp)) {
                            // Token truly expired
                            window.authModule.setSession(null, null);
                        }
                    }
                } catch(e) {
                    console.warn('Session parse info:', e);
                }
            } else if (token && !savedUserStr) {
                try {
                    window.jwtToken = token;
                    const base64Payload = token.split('.')[1];
                    const jsonStr = decodeURIComponent(escape(atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))));
                    const payload = JSON.parse(jsonStr);
                    if (payload) {
                        window.currentUser = { id: payload.sub, email: payload.email, name: payload.name || payload.email };
                    }
                } catch(e) {
                    window.authModule.setSession(null, null);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => window.authModule.updateUserUI());
            } else {
                window.authModule.updateUserUI();
            }
        }
    };

    window.handleGoogleAuthCallback = async function(response) {
        try {
            await window.authModule.googleAuth(response.credential);
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'none';
        } catch(err) {
            const errEl = document.getElementById('authErrorMsg');
            if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        }
    };

    window.authModule.init();
})();
