// ============================================
// إعدادات GitHub - ⚠️ استبدل هذه القيم بقيمك الخاصة
// ============================================
const GITHUB_USERNAME = 'moradel123';
const REPO_NAME = 'charity-platform';
const FILE_PATH = 'data.json';
// ⚠️ هام: هذا التوكن معروض علناً - قم بإلغائه فوراً وأنشئ توكن جديد
const TOKEN = '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'; // ❌ يجب تغييره فوراً

const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;
const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
const ADMIN_PASSWORD = 'admin123';

// المتغيرات العامة
let allProjects = [];
let currentFilter = 'all';
let projectsChart = null;
let statusChart = null;
let progressChart = null;
let currentProjects = [];

// ============================================
// دالة عرض الإشعارات المحسنة
// ============================================
function showAlert(message, type) {
    // إزالة أي إشعار سابق
    const oldAlert = document.querySelector('.custom-alert');
    if (oldAlert) oldAlert.remove();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.direction = 'rtl';
    alertDiv.style.boxShadow = '0 5px 20px rgba(0,0,0,0.2)';
    
    const icon = type === 'success' ? '✅' : type === 'danger' ? '❌' : 'ℹ️';
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <div>
                <strong>${icon} ${message}</strong>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // إخفاء تلقائي بعد 3 ثوانٍ
    setTimeout(() => {
        if (alertDiv && alertDiv.remove) {
            alertDiv.remove();
        }
    }, 3000);
}

// ============================================
// التحقق من صحة التوكن قبل الاستخدام
// ============================================
function validateToken() {
    if (!TOKEN || TOKEN === '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') {
        showAlert('⚠️ يرجى تحديث التوكن في ملف admin.js', 'danger');
        return false;
    }
    if (TOKEN.startsWith('ghp_') && TOKEN.length < 30) {
        showAlert('⚠️ التوكن يبدو غير صحيح، يرجى التحقق منه', 'danger');
        return false;
    }
    return true;
}

// ============================================
// التحقق من الدخول (محسن)
// ============================================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        const password = prompt('🔐 أدخل كلمة المرور الإدارية:');
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAlert('✅ مرحباً بك في لوحة التحكم', 'success');
        } else {
            alert('❌ كلمة المرور غير صحيحة');
            window.location.href = 'index.html';
        }
    }
}

// ============================================
// تسجيل الخروج
// ============================================
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}

// ============================================
// تبديل الأقسام (محسن)
// ============================================
function showSection(section, event) {
    // إخفاء جميع الأقسام
    const sections = ['dashboardSection', 'addProjectSection', 'manageProjectsSection', 'reportsSection'];
    sections.forEach(sec => {
        const element = document.getElementById(sec);
        if (element) element.style.display = 'none';
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) targetSection.style.display = 'block';
    
    // تحميل البيانات حسب القسم
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'manageProjects') {
        loadProjectsList();
    } else if (section === 'reports') {
        loadReports();
    }
    
    // تحديث النشاط في الشريط الجانبي
    if (event && event.target) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

// ============================================
// جلب البيانات من GitHub (محسن)
// ============================================
async function fetchData() {
    if (!validateToken()) return null;
    
    try {
        showAlert('جاري تحميل البيانات...', 'info');
        
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showAlert('❌ خطأ: التوكن غير صالح أو منتهي الصلاحية', 'danger');
            } else if (response.status === 404) {
                showAlert('❌ خطأ: ملف data.json غير موجود في المستودع', 'danger');
            } else {
                showAlert(`❌ خطأ ${response.status}: فشل في جلب البيانات`, 'danger');
            }
            return null;
        }
        
        const data = await response.json();
        const decodedContent = atob(data.content);
        const jsonData = JSON.parse(decodedContent);
        
        // التأكد من وجود هيكل البيانات الصحيح
        if (!jsonData.projects) {
            jsonData.projects = [];
        }
        if (!jsonData.lastUpdate) {
            jsonData.lastUpdate = new Date().toLocaleDateString('ar');
        }
        
        console.log('✅ تم جلب البيانات بنجاح:', jsonData);
        return { data: jsonData, sha: data.sha };
        
    } catch (error) {
        console.error('خطأ في fetchData:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showAlert('🌐 خطأ في الاتصال: تحقق من اتصالك بالإنترنت', 'danger');
        } else if (error.message.includes('JSON')) {
            showAlert('📄 خطأ: ملف data.json تالف أو غير صحيح', 'danger');
        } else {
            showAlert(`❌ حدث خطأ: ${error.message}`, 'danger');
        }
        return null;
    }
}

// ============================================
// حفظ البيانات إلى GitHub (محسن)
// ============================================
async function saveData(content, sha) {
    if (!validateToken()) return false;
    
    try {
        showAlert('جاري حفظ البيانات...', 'info');
        
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
        
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `تحديث البيانات - ${new Date().toLocaleString('ar')}`,
                content: encodedContent,
                sha: sha
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        showAlert('✅ تم الحفظ بنجاح!', 'success');
        return true;
        
    } catch (error) {
        console.error('خطأ في saveData:', error);
        showAlert(`❌ حدث خطأ في الحفظ: ${error.message}`, 'danger');
        return false;
    }
}

// ============================================
// إضافة مشروع جديد (محسن)
// ============================================
const addForm = document.getElementById('addProjectForm');
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // التحقق من صحة المدخلات
        const projectName = document.getElementById('projectName')?.value;
        const projectGoal = parseInt(document.getElementById('projectGoal')?.value);
        
        if (!projectName || !projectGoal || projectGoal <= 0) {
            showAlert('⚠️ يرجى إدخال اسم المشروع والمبلغ المستهدف بشكل صحيح', 'danger');
            return;
        }
        
        const newProject = {
            id: Date.now(),
            name: projectName,
            description: document.getElementById('projectDesc')?.value || '',
            goal: projectGoal,
            current: parseInt(document.getElementById('projectCurrent')?.value) || 0,
            donateLink: document.getElementById('projectLink')?.value || '',
            status: document.getElementById('projectStatus')?.value || 'active',
            donorsCount: 0,
            createdAt: new Date().toISOString()
        };
        
        const result = await fetchData();
        if (result) {
            result.data.projects.push(newProject);
            result.data.lastUpdate = new Date().toLocaleDateString('ar');
            
            if (await saveData(result.data, result.sha)) {
                addForm.reset();
                showAlert('✅ تم إضافة المشروع بنجاح!', 'success');
                // تحديث لوحة القيادة إذا كانت مفتوحة
                loadDashboard();
            }
        }
    });
}

// ============================================
// تحميل لوحة القيادة (محسن)
// ============================================
async function loadDashboard() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    currentProjects = projects;
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRaised = projects.reduce((sum, p) => sum + p.current, 0);
    const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
    
    // تحديث العناصر إذا كانت موجودة
    const elements = {
        totalProjects: document.getElementById('totalProjects'),
        activeProjectsCount: document.getElementById('activeProjectsCount'),
        totalRaised: document.getElementById('totalRaised'),
        totalGoal: document.getElementById('totalGoal')
    };
    
    if (elements.totalProjects) elements.totalProjects.innerText = totalProjects;
    if (elements.activeProjectsCount) elements.activeProjectsCount.innerText = activeProjects;
    if (elements.totalRaised) elements.totalRaised.innerText = totalRaised.toLocaleString();
    if (elements.totalGoal) elements.totalGoal.innerText = totalGoal.toLocaleString();
    
    // رسم المخططات
    const projectsChartCanvas = document.getElementById('projectsChart');
    const statusChartCanvas = document.getElementById('statusChart');
    
    if (projectsChartCanvas) {
        if (projectsChart) projectsChart.destroy();
        const ctx1 = projectsChartCanvas.getContext('2d');
        projectsChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: projects.slice(0, 5).map(p => p.name),
                datasets: [{
                    label: 'المبلغ المتبرع به',
                    data: projects.slice(0, 5).map(p => p.current),
                    backgroundColor: '#2ecc71',
                    borderRadius: 10
                }, {
                    label: 'المبلغ المستهدف',
                    data: projects.slice(0, 5).map(p => p.goal),
                    backgroundColor: '#3498db',
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
    
    if (statusChartCanvas) {
        if (statusChart) statusChart.destroy();
        const ctx2 = statusChartCanvas.getContext('2d');
        statusChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['نشط', 'مكتمل'],
                datasets: [{
                    data: [
                        projects.filter(p => p.status === 'active').length,
                        projects.filter(p => p.status === 'completed').length
                    ],
                    backgroundColor: ['#2ecc71', '#95a5a6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }
}

// ============================================
// تحميل قائمة المشاريع للإدارة (محسن)
// ============================================
async function loadProjectsList(searchTerm = '') {
    const result = await fetchData();
    if (!result) return;
    
    let projects = result.data.projects || [];
    if (searchTerm) {
        projects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    const container = document.getElementById('adminProjectsList');
    if (!container) return;
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center">📭 لا توجد مشاريع حالياً</div>';
        return;
    }
    
    container.innerHTML = projects.map(project => `
        <div class="project-item d-flex justify-content-between align-items-center p-3 mb-2 bg-white rounded shadow-sm" data-id="${project.id}">
            <div>
                <h6 class="mb-1 fw-bold">${escapeHtml(project.name)}</h6>
                <small class="text-muted">
                    🎯 ${project.goal.toLocaleString()} ريال | 💚 ${project.current.toLocaleString()} ريال
                </small>
                <br>
                <span class="status-badge ${project.status === 'active' ? 'status-active' : 'status-completed'} badge mt-2">
                    ${project.status === 'active' ? '🟢 نشط' : '🔵 مكتمل'}
                </span>
            </div>
            <div>
                <button class="btn btn-sm btn-warning me-2" onclick="editProject(${project.id})" title="تعديل">
                    ✏️
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.id})" title="حذف">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// دالة مساعدة لتشفير HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// تعديل مشروع (محسن)
// ============================================
async function editProject(id) {
    const result = await fetchData();
    if (!result) return;
    
    const project = result.data.projects.find(p => p.id === id);
    if (!project) {
        showAlert('⚠️ المشروع غير موجود', 'danger');
        return;
    }
    
    const newName = prompt('✏️ اسم المشروع الجديد:', project.name);
    if (newName && newName.trim()) project.name = newName.trim();
    
    const newGoal = prompt('💰 المبلغ المستهدف الجديد:', project.goal);
    if (newGoal && !isNaN(parseInt(newGoal))) project.goal = parseInt(newGoal);
    
    const newCurrent = prompt('💚 المبلغ المتبرع به حالياً:', project.current);
    if (newCurrent && !isNaN(parseInt(newCurrent))) project.current = parseInt(newCurrent);
    
    const newStatus = prompt('📌 الحالة الجديدة (active/completed):', project.status);
    if (newStatus && ['active', 'completed'].includes(newStatus.toLowerCase())) {
        project.status = newStatus.toLowerCase();
    }
    
    result.data.lastUpdate = new Date().toLocaleDateString('ar');
    if (await saveData(result.data, result.sha)) {
        await loadProjectsList();
        await loadDashboard();
        showAlert('✅ تم تعديل المشروع بنجاح!', 'success');
    }
}

// ============================================
// حذف مشروع (محسن)
// ============================================
async function deleteProject(id) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    const result = await fetchData();
    if (!result) return;
    
    const projectName = result.data.projects.find(p => p.id === id)?.name;
    result.data.projects = result.data.projects.filter(p => p.id !== id);
    result.data.lastUpdate = new Date().toLocaleDateString('ar');
    
    if (await saveData(result.data, result.sha)) {
        await loadProjectsList();
        await loadDashboard();
        showAlert(`✅ تم حذف المشروع "${projectName}" بنجاح!`, 'success');
    }
}

// ============================================
// تحميل التقارير (محسن)
// ============================================
async function loadReports() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    const totalRaised = projects.reduce((sum, p) => sum + p.current, 0);
    const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
    const percentage = totalGoal > 0 ? ((totalRaised / totalGoal) * 100).toFixed(1) : 0;
    const completedCount = projects.filter(p => p.status === 'completed' || p.current >= p.goal).length;
    
    const elements = {
        reportTotal: document.getElementById('reportTotal'),
        reportPercentage: document.getElementById('reportPercentage'),
        completedCount: document.getElementById('completedCount')
    };
    
    if (elements.reportTotal) elements.reportTotal.innerText = totalRaised.toLocaleString();
    if (elements.reportPercentage) elements.reportPercentage.innerText = percentage;
    if (elements.completedCount) elements.completedCount.innerText = completedCount;
    
    const progressChartCanvas = document.getElementById('progressChart');
    if (progressChartCanvas && projects.length > 0) {
        if (progressChart) progressChart.destroy();
        const ctx = progressChartCanvas.getContext('2d');
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: projects.map(p => p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name),
                datasets: [{
                    label: 'نسبة الإنجاز (%)',
                    data: projects.map(p => ((p.current / p.goal) * 100).toFixed(1)),
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw}% مكتمل`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ============================================
// تصدير التقرير (محسن)
// ============================================
async function exportReport() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    if (projects.length === 0) {
        showAlert('⚠️ لا توجد بيانات لتصديرها', 'danger');
        return;
    }
    
    // إنشاء محتوى CSV
    const headers = ['اسم المشروع', 'المبلغ المستهدف', 'المبلغ المتبرع به', 'نسبة الإنجاز', 'الحالة', 'تاريخ الإضافة'];
    const rows = projects.map(p => [
        `"${p.name}"`,
        p.goal,
        p.current,
        ((p.current / p.goal) * 100).toFixed(1) + '%',
        p.status === 'active' ? 'نشط' : 'مكتمل',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('ar') : '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // إضافة BOM للدعم العربي
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `تقرير_المشاريع_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('✅ تم تصدير التقرير بنجاح!', 'success');
}

// ============================================
// البحث في المشاريع (محسن)
// ============================================
const searchInput = document.getElementById('searchProjects');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        loadProjectsList(e.target.value);
    });
}

// ============================================
// تهيئة الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ تم تحميل لوحة التحكم');
    checkAuth();
    loadDashboard();
});
