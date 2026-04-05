// تكوين GitHub - قم بتعديل هذه المعلومات
const GITHUB_USERNAME = 'moradel123';
const REPO_NAME = 'charity-platform';
const FILE_PATH = 'data.json';
const TOKEN = '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';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;
let allProjects = [];
let currentFilter = 'all';

// تحميل البيانات من GitHub
async function loadData() {
    try {
        showLoading(true);
        const response = await fetch(RAW_URL + '?t=' + new Date().getTime());
        if (!response.ok) throw new Error('فشل في تحميل البيانات');
        const data = await response.json();
        allProjects = data.projects || [];
        
        // تحديث الإحصائيات
        document.getElementById('lastUpdate').innerText = data.lastUpdate || 'لم يتم التحديث';
        const totalDonors = allProjects.reduce((sum, p) => sum + (p.donorsCount || 0), 0);
        document.getElementById('totalDonors').innerText = totalDonors;
        
        updateStats();
        renderProjects();
    } catch (error) {
        console.error('خطأ:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
        document.getElementById('projectsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">⚠️ حدث خطأ في تحميل البيانات</div>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// عرض حالة التحميل
function showLoading(show) {
    if (show) {
        document.getElementById('projectsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner"></div>
                <p class="mt-3 text-white">جاري تحميل المشاريع...</p>
            </div>
        `;
    }
}

// تحديث الإحصائيات
function updateStats() {
    const activeCount = allProjects.filter(p => p.status === 'active').length;
    document.getElementById('activeProjects').innerText = activeCount;
}

// عرض المشاريع حسب الفلتر
function renderProjects() {
    let filteredProjects = allProjects;
    if (currentFilter !== 'all') {
        filteredProjects = allProjects.filter(p => p.status === currentFilter);
    }
    
    if (filteredProjects.length === 0) {
        document.getElementById('projectsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">📭 لا توجد مشاريع حالياً</div>
            </div>
        `;
        return;
    }
    
    const html = filteredProjects.map(project => {
        const percentage = Math.min((project.current / project.goal) * 100, 100);
        const isCompleted = project.current >= project.goal;
        
        return `
            <div class="col-md-6 col-lg-4" data-aos="fade-up">
                <div class="project-card card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title fw-bold">${project.name}</h5>
                            <span class="status-badge ${project.status === 'active' ? 'status-active' : 'status-completed'}">
                                ${project.status === 'active' ? '🟢 نشط' : '🔵 مكتمل'}
                            </span>
                        </div>
                        <p class="card-text text-muted">${project.description || 'لا يوجد وصف'}</p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>المستهدف: ${project.goal.toLocaleString()} ريال</small>
                                <small>تم التبرع: ${project.current.toLocaleString()} ريال</small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${percentage}%"></div>
                            </div>
                            <small class="text-muted">${percentage.toFixed(1)}% مكتمل</small>
                        </div>
                        ${project.status === 'active' && !isCompleted ? `
                            <a href="${project.donateLink || '#'}" target="_blank" class="donate-btn btn w-100">
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
    
    document.getElementById('projectsContainer').innerHTML = html;
}

// إضافة أحداث الفلتر
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

// عرض إشعار
function showNotification(message, type = 'success') {
    const toast = new bootstrap.Toast(document.getElementById('notificationToast'));
    document.getElementById('toastMessage').innerText = message;
    toast.show();
}

// التحديث التلقائي كل 30 ثانية
let autoRefresh = setInterval(() => {
    loadData();
    showNotification('تم تحديث البيانات تلقائياً', 'info');
}, 30000);

// بدء التحميل عند فتح الصفحة
loadData();
setupFilters();
