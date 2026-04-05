const GITHUB_USERNAME = 'moradelkhalili@gmail.com';
const REPO_NAME = 'charity-platform';
const FILE_PATH = 'data.json';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;
let allProjects = [];
let currentFilter = 'all';

const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
const ADMIN_PASSWORD = 'admin123';

let projectsChart = null;
let statusChart = null;
let progressChart = null;
let currentProjects = [];

// التحقق من الدخول
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        const password = prompt('🔐 أدخل كلمة المرور الإدارية:');
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
        } else {
            alert('❌ كلمة المرور غير صحيحة');
            window.location.href = 'index.html';
        }
    }
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}

// تبديل الأقسام
function showSection(section) {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('addProjectSection').style.display = 'none';
    document.getElementById('manageProjectsSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
    
    if (section === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        loadDashboard();
    } else if (section === 'addProject') {
        document.getElementById('addProjectSection').style.display = 'block';
    } else if (section === 'manageProjects') {
        document.getElementById('manageProjectsSection').style.display = 'block';
        loadProjectsList();
    } else if (section === 'reports') {
        document.getElementById('reportsSection').style.display = 'block';
        loadReports();
    }
    
    // تحديث النشاط في الشريط الجانبي
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// جلب البيانات من GitHub
async function fetchData() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        const data = await response.json();
        const content = JSON.parse(atob(data.content));
        return { data: content, sha: data.sha };
    } catch (error) {
        console.error('خطأ:', error);
        showAlert('حدث خطأ في جلب البيانات', 'danger');
        return null;
    }
}

// حفظ البيانات إلى GitHub
async function saveData(content, sha) {
    try {
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `تحديث البيانات - ${new Date().toLocaleString('ar')}`,
                content: encodedContent,
                sha: sha
            })
        });
        if (!response.ok) throw new Error('فشل في حفظ البيانات');
        showAlert('✅ تم الحفظ بنجاح!', 'success');
        return true;
    } catch (error) {
        console.error('خطأ:', error);
        showAlert('❌ حدث خطأ في الحفظ', 'danger');
        return false;
    }
}

// عرض إشعار
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// إضافة مشروع جديد
document.getElementById('addProjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newProject = {
        id: Date.now(),
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDesc').value,
        goal: parseInt(document.getElementById('projectGoal').value),
        current: parseInt(document.getElementById('projectCurrent').value),
        donateLink: document.getElementById('projectLink').value,
        status: document.getElementById('projectStatus').value,
        donorsCount: 0,
        createdAt: new Date().toISOString()
    };
    
    const result = await fetchData();
    if (result) {
        result.data.projects.push(newProject);
        result.data.lastUpdate = new Date().toLocaleDateString('ar');
        if (await saveData(result.data, result.sha)) {
            document.getElementById('addProjectForm').reset();
            showAlert('تم إضافة المشروع بنجاح!', 'success');
        }
    }
});

// تحميل لوحة القيادة
async function loadDashboard() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    currentProjects = projects;
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRaised = projects.reduce((sum, p) => sum + p.current, 0);
    const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
    
    document.getElementById('totalProjects').innerText = totalProjects;
    document.getElementById('activeProjectsCount').innerText = activeProjects;
    document.getElementById('totalRaised').innerText = totalRaised.toLocaleString();
    document.getElementById('totalGoal').innerText = totalGoal.toLocaleString();
    
    // رسم المخططات
    if (projectsChart) projectsChart.destroy();
    if (statusChart) statusChart.destroy();
    
    const ctx1 = document.getElementById('projectsChart').getContext('2d');
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
            maintainAspectRatio: true
        }
    });
    
    const ctx2 = document.getElementById('statusChart').getContext('2d');
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
        }
    });
}

// تحميل قائمة المشاريع للإدارة
async function loadProjectsList(searchTerm = '') {
    const result = await fetchData();
    if (!result) return;
    
    let projects = result.data.projects || [];
    if (searchTerm) {
        projects = projects.filter(p => p.name.includes(searchTerm));
    }
    
    const container = document.getElementById('adminProjectsList');
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد مشاريع</div>';
        return;
    }
    
    container.innerHTML = projects.map(project => `
        <div class="project-item d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">${project.name}</h6>
                <small class="text-muted">
                    🎯 ${project.goal.toLocaleString()} ريال | 💚 ${project.current.toLocaleString()} ريال
                </small>
                <br>
                <span class="status-badge ${project.status === 'active' ? 'status-active' : 'status-completed'} mt-2">
                    ${project.status === 'active' ? 'نشط' : 'مكتمل'}
                </span>
            </div>
            <div>
                <button class="btn btn-sm btn-edit me-2" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteProject(${project.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// تعديل مشروع
async function editProject(id) {
    const result = await fetchData();
    if (!result) return;
    
    const project = result.data.projects.find(p => p.id === id);
    if (!project) return;
    
    const newName = prompt('اسم المشروع الجديد:', project.name);
    if (newName) project.name = newName;
    
    const newGoal = prompt('المبلغ المستهدف الجديد:', project.goal);
    if (newGoal) project.goal = parseInt(newGoal);
    
    const newCurrent = prompt('المبلغ المتبرع به حالياً:', project.current);
    if (newCurrent) project.current = parseInt(newCurrent);
    
    const newStatus = prompt('الحالة الجديدة (active/completed):', project.status);
    if (newStatus && ['active', 'completed'].includes(newStatus)) project.status = newStatus;
    
    result.data.lastUpdate = new Date().toLocaleDateString('ar');
    if (await saveData(result.data, result.sha)) {
        loadProjectsList();
        showAlert('تم تعديل المشروع بنجاح!', 'success');
    }
}

// حذف مشروع
async function deleteProject(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    
    const result = await fetchData();
    if (!result) return;
    
    result.data.projects = result.data.projects.filter(p => p.id !== id);
    result.data.lastUpdate = new Date().toLocaleDateString('ar');
    
    if (await saveData(result.data, result.sha)) {
        loadProjectsList();
        showAlert('تم حذف المشروع بنجاح!', 'success');
    }
}

// تحميل التقارير
async function loadReports() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    const totalRaised = projects.reduce((sum, p) => sum + p.current, 0);
    const totalGoal = projects.reduce((sum, p) => sum + p.goal, 0);
    const percentage = totalGoal > 0 ? (totalRaised / totalGoal * 100).toFixed(1) : 0;
    const completedCount = projects.filter(p => p.status === 'completed' || p.current >= p.goal).length;
    
    document.getElementById('reportTotal').innerText = totalRaised.toLocaleString();
    document.getElementById('reportPercentage').innerText = percentage;
    document.getElementById('completedCount').innerText = completedCount;
    
    if (progressChart) progressChart.destroy();
    
    const ctx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: projects.map(p => p.name),
            datasets: [{
                label: 'نسبة الإنجاز (%)',
                data: projects.map(p => (p.current / p.goal * 100).toFixed(1)),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                tension: 0.4
            }]
        }
    });
}

// تصدير التقرير
async function exportReport() {
    const result = await fetchData();
    if (!result) return;
    
    const projects = result.data.projects || [];
    let csv = 'الاسم,المبلغ المستهدف,المبلغ المتبرع به,النسبة,الحالة\n';
    
    projects.forEach(p => {
        const percentage = ((p.current / p.goal) * 100).toFixed(1);
        csv += `"${p.name}",${p.goal},${p.current},${percentage}%,${p.status === 'active' ? 'نشط' : 'مكتمل'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `تقرير_المشاريع_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('تم تصدير التقرير بنجاح!', 'success');
}

// البحث في المشاريع
document.getElementById('searchProjects')?.addEventListener('input', (e) => {
    loadProjectsList(e.target.value);
});

// بدء التحميل عند فتح الصفحة
checkAuth();
loadDashboard();