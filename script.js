// ============================================
// تكوين GitHub - للقراءة فقط (آمن)
// ============================================
const GITHUB_USERNAME = 'moradel123';
const REPO_NAME = 'charity-platform';
const FILE_PATH = 'data.json';
// ملاحظة: هذا الملف للقراءة فقط، لا يحتاج توكن
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;

let allProjects = [];
let currentFilter = 'all';

// ============================================
// تحميل البيانات من GitHub
// ============================================
async function loadData() {
    try {
        showLoading(true);
        
        // إضافة معامل timestamp لمنع التخزين المؤقت
        const response = await fetch(RAW_URL + '?t=' + new Date().getTime());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        allProjects = data.projects || [];
        
        // تحديث الإحصائيات
        const lastUpdateElem = document.getElementById('lastUpdate');
        if (lastUpdateElem) {
            lastUpdateElem.innerText = data.lastUpdate || 'لم يتم التحديث';
        }
        
        const totalDonors = allProjects.reduce((sum, p) => sum + (p.donorsCount || 0), 0);
        const totalDonorsElem = document.getElementById('totalDonors');
        if (totalDonorsElem) {
            totalDonorsElem.innerText = totalDonors;
        }
        
        updateStats();
        renderProjects();
        
        console.log('✅ تم تحميل البيانات بنجاح:', allProjects.length, 'مشروع');
        
    } catch (error) {
        console.error('خطأ في loadData:', error);
        
        let errorMessage = 'حدث خطأ في تحميل البيانات';
        if (error.message.includes('404')) {
            errorMessage = '⚠️ ملف البيانات غير موجود. يرجى التأكد من وجود data.json';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '🌐 خطأ في الاتصال. تحقق من اتصالك بالإنترنت';
        }
        
        showNotification(errorMessage, 'error');
        
        const container = document.getElementById('projectsContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i> ${errorMessage}
                    </div>
                </div>
            `;
        }
    } finally {
        showLoading(false);
    }
}

// ============================================
// عرض حالة التحميل
// ============================================
function showLoading(show) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <p class="mt-3 text-white">جاري تحميل المشاريع...</p>
            </div>
        `;
    }
}

// ============================================
// تحديث الإحصائيات
// ============================================
function updateStats() {
    const activeCount = allProjects.filter(p => p.status === 'active').length;
    const activeElem = document.getElementById('activeProjects');
    if (activeElem) {
        activeElem.innerText = activeCount;
    }
}

// ============================================
// عرض المشاريع حسب الفلتر
// ============================================
function renderProjects() {
    let filteredProjects = allProjects;
    
    if (currentFilter !== 'all') {
        filteredProjects = allProjects.filter(p => p.status === currentFilter);
    }
    
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 📭 لا توجد مشاريع حالياً
                </div>
            </div>
        `;
        return;
    }
    
    const html = filteredProjects.map(project => {
        const percentage = Math.min((project.current / project.goal) * 100, 100);
        const isCompleted = project.current >= project.goal;
        
        return `
            <div class="col-md-6 col-lg-4" data-aos="fade-up">
                <div class="project-card card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title fw-bold">${escapeHtml(project.name)}</h5>
                            <span class="status-badge ${project.status === 'active' ? 'status-active' : 'status-completed'}">
                                ${project.status === 'active' ? '🟢 نشط' : '🔵 مكتمل'}
                            </span>
                        </div>
                        <p class="card-text text-muted">${escapeHtml(project.description || 'لا يوجد وصف')}</p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>المستهدف: ${project.goal.toLocaleString()} ريال</small>
                                <small>تم التبرع: ${project.current.toLocaleString()} ريال</small>
                            </div>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-success" style="width: ${percentage}%"></div>
                            </div>
                            <small class="text-muted">${percentage.toFixed(1)}% مكتمل</small>
                        </div>
                        ${project.status === 'active' && !isCompleted && project.donateLink ? `
                            <a href="${project.donateLink}" target="_blank" class="btn btn-success w-100">
                                <i class="fas fa-hand-holding-heart"></i> تبرع الآن
                            </a>
                        ` : isCompleted && project.status === 'active' ? `
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="fas fa-check-circle"></i> اكتمل المشروع
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ============================================
// دالة لتشفير HTML (منع هجمات XSS)
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// إضافة أحداث الفلتر
// ============================================
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderProjects();
        });
    });
}

// ============================================
// عرض إشعار
// ============================================
function showNotification(message, type = 'success') {
    const toastElement = document.getElementById('notificationToast');
    if (!toastElement) return;
    
    const toastBody = document.getElementById('toastMessage');
    if (toastBody) {
        toastBody.innerText = message;
    }
    
    // تغيير لون الإشعار حسب النوع
    const toastHeader = toastElement.querySelector('.toast-header');
    if (toastHeader) {
        if (type === 'error') {
            toastHeader.style.backgroundColor = '#dc3545';
            toastHeader.style.color = 'white';
        } else if (type === 'success') {
            toastHeader.style.backgroundColor = '#198754';
            toastHeader.style.color = 'white';
        } else {
            toastHeader.style.backgroundColor = '#0dcaf0';
            toastHeader.style.color = 'black';
        }
        
        // إعادة التعيين بعد 3 ثوانٍ
        setTimeout(() => {
            toastHeader.style.backgroundColor = '';
            toastHeader.style.color = '';
        }, 3000);
    }
    
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();
}

// ============================================
// التحديث التلقائي كل 30 ثانية
// ============================================
let autoRefresh = setInterval(() => {
    loadData();
    showNotification('تم تحديث البيانات تلقائياً', 'info');
}, 30000);

// ============================================
// بدء التحميل عند فتح الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupFilters();
});

// ============================================
// إيقاف التحديث التلقائي عند مغادرة الصفحة
// ============================================
window.addEventListener('beforeunload', () => {
    if (autoRefresh) {
        clearInterval(autoRefresh);
    }
});
