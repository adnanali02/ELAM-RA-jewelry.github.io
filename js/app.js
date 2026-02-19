/**
 * =====================================================
   التطبيق الرئيسي
   Main Application
 * =====================================================
 * الملف: frontend/js/app.js
 * الغرض: المنطق الرئيسي للتطبيق
 * =====================================================
 */

// =====================================================
// فئة التطبيق الرئيسي
// Main App Class
// =====================================================
class GoldMarketApp {
    constructor() {
        this.goldPrices = [];
        this.currencyRates = [];
        this.storeInfo = {};
        this.marketStatus = { isOpen: false };
        this.updateInterval = null;
        this.clockInterval = null;
        
        this.init();
    }

    /**
     * التهيئة
     * Initialize
     */
    async init() {
        try {
            console.log('Initializing Gold Market App...');
            
            // تهيئة الساعة
            this.initClock();
            
            // جلب البيانات الأولية
            await this.fetchInitialData();
            
            // عرض البيانات
            this.render();
            
            // بدء التحديثات التلقائية
            this.startAutoUpdate();
            
            // إضافة مستمعي الأحداث
            this.attachEventListeners();
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    /**
     * تهيئة الساعة
     * Initialize clock
     */
    initClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }

    /**
     * تحديث الساعة
     * Update clock
     */
    updateClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        clockElement.textContent = timeString;
    }

    /**
     * جلب البيانات الأولية
     * Fetch initial data
     */
    async fetchInitialData() {
        try {
            // جلب معلومات المتجر
            const storeResponse = await SettingsAPI.getStoreInfo();
            if (storeResponse.success) {
                this.storeInfo = storeResponse.data;
                this.updateStoreInfo();
            }

            // جلب حالة السوق
            const marketResponse = await SettingsAPI.checkMarketStatus();
            if (marketResponse.success) {
                this.marketStatus = marketResponse.data;
                this.updateMarketStatus();
            }

            // جلب أسعار الذهب
            await this.fetchGoldPrices();

            // جلب أسعار العملات
            await this.fetchCurrencyRates();

        } catch (error) {
            console.error('Error fetching initial data:', error);
            throw error;
        }
    }

    /**
     * جلب أسعار الذهب
     * Fetch gold prices
     */
    async fetchGoldPrices() {
        try {
            const response = await GoldAPI.getAllPrices();
            if (response.success) {
                this.goldPrices = response.data;
                this.renderGoldPrices();
            }
        } catch (error) {
            console.error('Error fetching gold prices:', error);
        }
    }

    /**
     * جلب أسعار العملات
     * Fetch currency rates
     */
    async fetchCurrencyRates() {
        try {
            const response = await CurrencyAPI.getAllRates();
            if (response.success) {
                this.currencyRates = response.data;
                this.renderCurrencyRates();
            }
        } catch (error) {
            console.error('Error fetching currency rates:', error);
        }
    }

    /**
     * تحديث معلومات المتجر
     * Update store info
     */
    updateStoreInfo() {
        const logoText = document.querySelector('.logo-text');
        if (logoText && this.storeInfo.name) {
            logoText.textContent = this.storeInfo.name;
        }

        // تحديث الفوتر
        const footerName = document.getElementById('footer-store-name');
        if (footerName && this.storeInfo.name) {
            footerName.textContent = this.storeInfo.name;
        }

        const footerAddress = document.getElementById('footer-address');
        if (footerAddress && this.storeInfo.address) {
            footerAddress.textContent = this.storeInfo.address;
        }

        const footerPhone = document.getElementById('footer-phone');
        if (footerPhone && this.storeInfo.phone) {
            footerPhone.textContent = this.storeInfo.phone;
            footerPhone.href = `tel:${this.storeInfo.phone}`;
        }

        const footerWhatsapp = document.getElementById('footer-whatsapp');
        if (footerWhatsapp && this.storeInfo.whatsapp) {
            footerWhatsapp.href = `https://wa.me/${this.storeInfo.whatsapp.replace(/\D/g, '')}`;
        }

        const footerInstagram = document.getElementById('footer-instagram');
        if (footerInstagram && this.storeInfo.instagram) {
            footerInstagram.href = `https://instagram.com/${this.storeInfo.instagram.replace('@', '')}`;
        }

        const footerFacebook = document.getElementById('footer-facebook');
        if (footerFacebook && this.storeInfo.facebook) {
            footerFacebook.href = `https://facebook.com/${this.storeInfo.facebook}`;
        }
    }

    /**
     * تحديث حالة السوق
     * Update market status
     */
    updateMarketStatus() {
        const indicator = document.querySelector('.status-indicator');
        const text = document.querySelector('.status-text');

        if (indicator && text) {
            const isOpen = this.marketStatus.isOpen;
            indicator.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
            text.className = `status-text ${isOpen ? 'open' : 'closed'}`;
            text.textContent = isOpen ? 'السوق مفتوح' : 'السوق مغلق';
        }
    }

    /**
     * عرض أسعار الذهب
     * Render gold prices
     */
    renderGoldPrices() {
        const container = document.getElementById('gold-prices-grid');
        if (!container) return;

        container.innerHTML = this.goldPrices.map(price => this.createGoldPriceCard(price)).join('');
    }

    /**
     * إنشاء بطاقة سعر الذهب
     * Create gold price card
     */
    createGoldPriceCard(price) {
        const spread = (price.sellPrice - price.buyPrice).toFixed(2);
        
        return `
            <div class="card card-price" data-id="${price.id}">
                <div class="card-title">${price.goldTypeName}</div>
                <div class="card-value">${price.karat}K</div>
                <div class="card-prices">
                    <div class="price-item">
                        <span class="price-label">سعر الشراء</span>
                        <span class="price-value price-buy">${price.buyPrice.toLocaleString()}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">سعر البيع</span>
                        <span class="price-value price-sell">${price.sellPrice.toLocaleString()}</span>
                    </div>
                </div>
                <div class="mt-4 text-sm text-muted">
                    الفرق: <span class="text-gold">${spread}</span>
                </div>
            </div>
        `;
    }

    /**
     * عرض أسعار العملات
     * Render currency rates
     */
    renderCurrencyRates() {
        const container = document.getElementById('currency-rates-grid');
        if (!container) return;

        container.innerHTML = this.currencyRates.map(rate => this.createCurrencyRateCard(rate)).join('');
    }

    /**
     * إنشاء بطاقة سعر العملة
     * Create currency rate card
     */
    createCurrencyRateCard(rate) {
        const spread = (rate.sellRate - rate.buyRate).toFixed(4);
        
        return `
            <div class="card card-price" data-id="${rate.id}">
                <div class="card-title">
                    <span class="text-2xl">${rate.flagEmoji || '🏳️'}</span>
                    ${rate.currencyName}
                </div>
                <div class="card-value">${rate.currencyCode}</div>
                <div class="card-prices">
                    <div class="price-item">
                        <span class="price-label">سعر الشراء</span>
                        <span class="price-value price-buy">${rate.buyRate.toFixed(4)}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">سعر البيع</span>
                        <span class="price-value price-sell">${rate.sellRate.toFixed(4)}</span>
                    </div>
                </div>
                <div class="mt-4 text-sm text-muted">
                    الفرق: <span class="text-gold">${spread}</span>
                </div>
            </div>
        `;
    }

    /**
     * عرض الصفحة
     * Render page
     */
    render() {
        this.renderGoldPrices();
        this.renderCurrencyRates();
    }

    /**
     * بدء التحديثات التلقائية
     * Start auto update
     */
    startAutoUpdate() {
        // تحديث كل 30 ثانية
        this.updateInterval = setInterval(() => {
            this.fetchGoldPrices();
            this.fetchCurrencyRates();
            this.updateMarketStatus();
        }, 30000);
    }

    /**
     * إيقاف التحديثات التلقائية
     * Stop auto update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    /**
     * إضافة مستمعي الأحداث
     * Attach event listeners
     */
    attachEventListeners() {
        // زر إدارة النظام
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                window.location.href = '/login.html';
            });
        }

        // تأثيرات البطاقات
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                card.style.transform = 'scale(1.02)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                card.style.transform = '';
            }
        });
    }

    /**
     * عرض خطأ
     * Show error
     */
    showError(message) {
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="icon">⚠️</i>
                    <span>${message}</span>
                </div>
            `;
        }
    }

    /**
     * عرض رسالة نجاح
     * Show success
     */
    showSuccess(message) {
        const container = document.getElementById('success-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="icon">✓</i>
                    <span>${message}</span>
                </div>
            `;
            
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }
    }
}

// =====================================================
// تهيئة التطبيق عند تحميل الصفحة
// Initialize app on page load
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GoldMarketApp();
});

// =====================================================
// تنظيف عند إغلاق الصفحة
// Cleanup on page unload
// =====================================================
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.stopAutoUpdate();
    }
});
