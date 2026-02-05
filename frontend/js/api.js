/**
 * =====================================================
   API Client
 * =====================================================
 * الملف: frontend/js/api.js
 * الغرض: إدارة الاتصال بالـ API
 * =====================================================
 */

// =====================================================
// إعدادات API
// API Configuration
// =====================================================
const API_CONFIG = {
    BASE_URL: window.location.origin,
    API_PREFIX: '/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

// =====================================================
// فئة API
// API Class
// =====================================================
class API {
    /**
     * إنشاء عنوان URL كامل
     * Build full URL
     */
    static buildUrl(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${cleanEndpoint}`;
    }

    /**
     * الحصول على CSRF Token
     * Get CSRF token
     */
    static getCSRFToken() {
        // من الكوكي
        const match = document.cookie.match(/csrf_token=([^;]+)/);
        if (match) return match[1];
        
        // من الـ meta tag
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.content;
        
        return null;
    }

    /**
     * إعداد Headers
     * Setup headers
     */
    static getHeaders(includeCSRF = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (includeCSRF) {
            const csrfToken = this.getCSRFToken();
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
        }

        return headers;
    }

    /**
     * معالجة الاستجابة
     * Handle response
     */
    static async handleResponse(response) {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.code = data?.code || 'UNKNOWN_ERROR';
            error.data = data;
            throw error;
        }

        return data;
    }

    /**
     * طلب GET
     * GET request
     */
    static async get(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        const queryParams = options.params 
            ? '?' + new URLSearchParams(options.params).toString() 
            : '';

        const response = await fetch(url + queryParams, {
            method: 'GET',
            headers: this.getHeaders(false),
            credentials: 'include'
        });

        return this.handleResponse(response);
    }

    /**
     * طلب POST
     * POST request
     */
    static async post(endpoint, data, options = {}) {
        const url = this.buildUrl(endpoint);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(true),
            credentials: 'include',
            body: JSON.stringify(data)
        });

        return this.handleResponse(response);
    }

    /**
     * طلب PUT
     * PUT request
     */
    static async put(endpoint, data, options = {}) {
        const url = this.buildUrl(endpoint);

        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(true),
            credentials: 'include',
            body: JSON.stringify(data)
        });

        return this.handleResponse(response);
    }

    /**
     * طلب DELETE
     * DELETE request
     */
    static async delete(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(true),
            credentials: 'include'
        });

        return this.handleResponse(response);
    }

    /**
     * طلب مع إعادة المحاولة
     * Request with retry
     */
    static async requestWithRetry(method, endpoint, data = null, options = {}) {
        const maxAttempts = options.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this[method](endpoint, data, options);
            } catch (error) {
                lastError = error;
                
                // لا تُعِد المحاولة لأخطاء العميل
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // انتظار قبل إعادة المحاولة
                if (attempt < maxAttempts) {
                    await new Promise(resolve => 
                        setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt)
                    );
                }
            }
        }

        throw lastError;
    }
}

// =====================================================
// خدمات API المحددة
// API Services
// =====================================================

const AuthAPI = {
    /**
     * الحصول على CSRF Token
     */
    getCSRFToken() {
        return API.get('/auth/csrf');
    },

    /**
     * تسجيل الدخول
     */
    login(username, password) {
        return API.post('/auth/login', { username, password });
    },

    /**
     * تسجيل الخروج
     */
    logout() {
        return API.post('/auth/logout');
    },

    /**
     * التحقق من الجلسة
     */
    checkSession() {
        return API.get('/auth/session');
    },

    /**
     * تغيير كلمة المرور
     */
    changePassword(currentPassword, newPassword) {
        return API.post('/auth/change-password', { currentPassword, newPassword });
    },

    /**
     * تجديد الجلسة
     */
    refreshSession() {
        return API.post('/auth/refresh');
    }
};

const GoldAPI = {
    /**
     * جلب جميع أسعار الذهب
     */
    getAllPrices() {
        return API.get('/gold/prices');
    },

    /**
     * جلب أنواع الذهب
     */
    getGoldTypes() {
        return API.get('/gold/types');
    },

    /**
     * جلب سعر الذهب حسب المعرف
     */
    getPriceById(id) {
        return API.get(`/gold/prices/${id}`);
    },

    /**
     * جلب السعر الحالي
     */
    getCurrentPrice(goldTypeId) {
        return API.get(`/gold/current/${goldTypeId}`);
    },

    /**
     * جلب تاريخ الأسعار
     */
    getPriceHistory(goldTypeId, options = {}) {
        const params = new URLSearchParams(options).toString();
        return API.get(`/gold/history/${goldTypeId}?${params}`);
    },

    /**
     * مقارنة الأسعار
     */
    comparePrices() {
        return API.get('/gold/compare');
    },

    /**
     * جلب الإحصائيات
     */
    getStatistics(goldTypeId, days = 30) {
        return API.get(`/gold/statistics/${goldTypeId}?days=${days}`);
    },

    /**
     * إنشاء سعر جديد
     */
    createPrice(priceData) {
        return API.post('/gold/prices', priceData);
    },

    /**
     * تحديث سعر
     */
    updatePrice(id, priceData) {
        return API.put(`/gold/prices/${id}`, priceData);
    },

    /**
     * حذف سعر
     */
    deletePrice(id) {
        return API.delete(`/gold/prices/${id}`);
    },

    /**
     * تحديث تلقائي للأسعار
     */
    autoUpdate(basePrice24k) {
        return API.post('/gold/auto-update', { basePrice24k });
    }
};

const CurrencyAPI = {
    /**
     * جلب جميع أسعار العملات
     */
    getAllRates() {
        return API.get('/currency/rates');
    },

    /**
     * جلب العملات
     */
    getCurrencies() {
        return API.get('/currency/currencies');
    },

    /**
     * جلب سعر العملة حسب المعرف
     */
    getRateById(id) {
        return API.get(`/currency/rates/${id}`);
    },

    /**
     * جلب السعر الحالي
     */
    getCurrentRate(currencyId) {
        return API.get(`/currency/current/${currencyId}`);
    },

    /**
     * جلب السعر حسب الكود
     */
    getRateByCode(code) {
        return API.get(`/currency/code/${code}`);
    },

    /**
     * جلب تاريخ الأسعار
     */
    getRateHistory(currencyId, options = {}) {
        const params = new URLSearchParams(options).toString();
        return API.get(`/currency/history/${currencyId}?${params}`);
    },

    /**
     * تحويل العملات
     */
    convert(amount, from, to, type = 'buy') {
        return API.post('/currency/convert', { amount, from, to, type });
    },

    /**
     * مقارنة الأسعار
     */
    compareRates() {
        return API.get('/currency/compare');
    },

    /**
     * جلب الإحصائيات
     */
    getStatistics(currencyId, days = 30) {
        return API.get(`/currency/statistics/${currencyId}?days=${days}`);
    },

    /**
     * إنشاء سعر جديد
     */
    createRate(rateData) {
        return API.post('/currency/rates', rateData);
    },

    /**
     * تحديث سعر
     */
    updateRate(id, rateData) {
        return API.put(`/currency/rates/${id}`, rateData);
    },

    /**
     * حذف سعر
     */
    deleteRate(id) {
        return API.delete(`/currency/rates/${id}`);
    },

    /**
     * تحديث جميع الأسعار
     */
    bulkUpdate(rates) {
        return API.post('/currency/bulk-update', { rates });
    }
};

const UserAPI = {
    /**
     * جلب الملف الشخصي
     */
    getProfile() {
        return API.get('/users/profile');
    },

    /**
     * تحديث الملف الشخصي
     */
    updateProfile(data) {
        return API.put('/users/profile', data);
    },

    /**
     * جلب جميع المستخدمين
     */
    getAllUsers(options = {}) {
        const params = new URLSearchParams(options).toString();
        return API.get(`/users?${params}`);
    },

    /**
     * جلب إحصائيات المستخدمين
     */
    getStatistics() {
        return API.get('/users/statistics');
    },

    /**
     * جلب مستخدم حسب المعرف
     */
    getUserById(id) {
        return API.get(`/users/${id}`);
    },

    /**
     * إنشاء مستخدم
     */
    createUser(userData) {
        return API.post('/users', userData);
    },

    /**
     * تحديث مستخدم
     */
    updateUser(id, userData) {
        return API.put(`/users/${id}`, userData);
    },

    /**
     * حذف مستخدم
     */
    deleteUser(id) {
        return API.delete(`/users/${id}`);
    },

    /**
     * تغيير كلمة المرور
     */
    changeUserPassword(id, newPassword) {
        return API.post(`/users/${id}/change-password`, { newPassword });
    },

    /**
     * تفعيل/تعطيل مستخدم
     */
    toggleUserStatus(id, isActive) {
        return API.put(`/users/${id}/status`, { isActive });
    }
};

const SettingsAPI = {
    /**
     * جلب جميع الإعدادات
     */
    getAllSettings() {
        return API.get('/settings');
    },

    /**
     * جلب إعداد محدد
     */
    getSetting(key) {
        return API.get(`/settings/${key}`);
    },

    /**
     * تعيين إعداد
     */
    setSetting(key, value, type = 'string') {
        return API.put(`/settings/${key}`, { value, type });
    },

    /**
     * حذف إعداد
     */
    deleteSetting(key) {
        return API.delete(`/settings/${key}`);
    },

    /**
     * جلب معلومات المتجر
     */
    getStoreInfo() {
        return API.get('/settings/store');
    },

    /**
     * تحديث معلومات المتجر
     */
    updateStoreInfo(info) {
        return API.put('/settings/store', info);
    },

    /**
     * جلب إعدادات السوق
     */
    getMarketSettings() {
        return API.get('/settings/market');
    },

    /**
     * تحديث إعدادات السوق
     */
    updateMarketSettings(settings) {
        return API.put('/settings/market', settings);
    },

    /**
     * جلب إعدادات الهوامش
     */
    getMarginSettings() {
        return API.get('/settings/margins');
    },

    /**
     * تحديث إعدادات الهوامش
     */
    updateMarginSettings(margins) {
        return API.put('/settings/margins', margins);
    },

    /**
     * جلب إعدادات الأمان
     */
    getSecuritySettings() {
        return API.get('/settings/security');
    },

    /**
     * تحديث إعدادات الأمان
     */
    updateSecuritySettings(settings) {
        return API.put('/settings/security', settings);
    },

    /**
     * التحقق من حالة السوق
     */
    checkMarketStatus() {
        return API.get('/settings/market/status');
    },

    /**
     * إعادة تعيين الإعدادات
     */
    resetToDefaults() {
        return API.post('/settings/reset');
    }
};

// =====================================================
// تصدير الخدمات
// Export services
// =====================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, AuthAPI, GoldAPI, CurrencyAPI, UserAPI, SettingsAPI };
}