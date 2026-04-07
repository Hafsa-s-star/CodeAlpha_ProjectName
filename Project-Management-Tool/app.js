// === DOM Elements ===
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');

// Auth elements
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthLink = document.getElementById('toggle-auth-link');
const authToggleText = document.getElementById('auth-toggle-text');

// Main layout elements
const navDashboard = document.getElementById('nav-dashboard');
const currentUsername = document.getElementById('current-username');
const logoutBtn = document.getElementById('logout-btn');
const pageTitle = document.getElementById('page-title');
const headerActions = document.getElementById('header-actions');

// Sub-views
const dashboardContent = document.getElementById('dashboard-content');
const projectBoardContent = document.getElementById('project-board-content');

// Content elements
const projectsGrid = document.getElementById('projects-grid');
const projectDescHeader = document.getElementById('project-desc');

// Kanban Columns
const listTodo = document.getElementById('list-todo');
const listInprogress = document.getElementById('list-inprogress');
const listDone = document.getElementById('list-done');
const countTodo = document.getElementById('count-todo');
const countInprogress = document.getElementById('count-inprogress');
const countDone = document.getElementById('count-done');

// Buttons
const btnCreateProject = document.getElementById('btn-create-project');
const btnCreateTask = document.getElementById('btn-create-task');

// Modals
const modalOverlay = document.getElementById('modal-overlay');
const modalProject = document.getElementById('modal-project');
const modalTask = document.getElementById('modal-task');
const modalTaskDetails = document.getElementById('modal-task-details');

const closeProjectModal = document.getElementById('close-project-modal');
const closeTaskModal = document.getElementById('close-task-modal');
const closeDetailsModal = document.getElementById('close-details-modal');

// Forms inside Modals
const formProject = document.getElementById('form-project');
const formTask = document.getElementById('form-task');
const formComment = document.getElementById('form-comment');

// State Variables
let isLoginMode = true;
let currentUser = null;
let currentToken = null;
let currentProjectId = null;
let currentTaskId = null;
let allUsers = [];

// Base API URL
const API_URL = 'http://localhost:3000';

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('nexus_user');
    const storedToken = localStorage.getItem('nexus_token');
    
    if (storedUser && storedToken) {
        currentUser = JSON.parse(storedUser);
        currentToken = storedToken;
        showMainView();
    }
});

// === Auth Flow ===
toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = "Welcome Back";
        authSubtitle.innerText = "Enter your details to manage your projects.";
        authSubmitBtn.innerText = "Login";
        authToggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-auth-link">Sign up</a>`;
    } else {
        authTitle.innerText = "Create Account";
        authSubtitle.innerText = "Sign up to start collaborating today.";
        authSubmitBtn.innerText = "Sign Up";
        authToggleText.innerHTML = `Already have an account? <a href="#" id="toggle-auth-link">Login</a>`;
    }
    document.getElementById('toggle-auth-link').addEventListener('click', arguments.callee);
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Please fill in all fields' });
        return;
    }

    try {
        const endpoint = isLoginMode ? '/auth/login' : '/auth/signup';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Authenication failed' });
            return;
        }

        if (!isLoginMode) {
            Swal.fire({ icon: 'success', title: 'Signed Up!', text: 'Successfully created account. You can now log in.' });
            isLoginMode = true;
            document.getElementById('toggle-auth-link').click(); // trigger switch to login
        } else {
            currentUser = data.user;
            currentToken = data.token;
            localStorage.setItem('nexus_user', JSON.stringify(currentUser));
            localStorage.setItem('nexus_token', currentToken);
            showMainView();
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Could not connect to the server.' });
    }
});

function logout() {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    currentUser = null;
    currentToken = null;
    
    // Switch Views
    mainView.classList.add('hidden');
    mainView.classList.remove('active');
    authView.classList.remove('hidden');
    authView.classList.add('active');
    
    // Reset Form
    usernameInput.value = '';
    passwordInput.value = '';
}

logoutBtn.addEventListener('click', logout);


// === Main View Navigation ===
function showMainView() {
    authView.classList.add('hidden');
    authView.classList.remove('active');
    mainView.classList.remove('hidden');
    mainView.classList.add('active');
    
    currentUsername.innerText = currentUser.username;
    
    loadAllUsers();
    loadDashboard();
}

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    loadDashboard();
});

// Load All Users for Task Assignment
async function loadAllUsers() {
    try {
        const res = await fetch(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.ok) {
            allUsers = await res.json();
            const assigneeSelect = document.getElementById('task-assignee');
            assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
            allUsers.forEach(u => {
                assigneeSelect.innerHTML += `<option value="${u.id}">${u.username}</option>`;
            });
        }
    } catch (e) {
        console.error('Failed to load users');
    }
}

// === Dashboard & Projects ===
async function loadDashboard() {
    currentProjectId = null;
    pageTitle.innerText = "Dashboard";
    btnCreateProject.classList.remove('hidden');
    
    // Manage Views
    dashboardContent.classList.remove('hidden');
    projectBoardContent.classList.add('hidden');
    
    projectsGrid.innerHTML = '<p class="text-muted">Loading projects...</p>';

    try {
        const res = await fetch(`${API_URL}/api/projects`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.status === 401 || res.status === 403) return logout();
        
        const projects = await res.json();
        
        if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;" class="glass-panel">
                    <h3>No Projects Yet</h3>
                    <p class="text-muted" style="margin-top: 10px;">Create your first project to get started.</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = '';
        projects.forEach(p => {
            const date = new Date(p.created_at).toLocaleDateString();
            const card = document.createElement('div');
            card.className = 'glass-panel project-card';
            card.innerHTML = `
                <h3>${p.title}</h3>
                <p>${p.description || 'No description provided.'}</p>
                <div class="project-footer">
                    <span>Created: ${date}</span>
                    <button class="btn-icon open-proj" data-id="${p.id}" data-title="${p.title}" data-desc="${p.description}"><i class='bx bx-right-arrow-alt'></i> Open</button>
                </div>
            `;
            projectsGrid.appendChild(card);
        });

        document.querySelectorAll('.open-proj').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targ = e.currentTarget;
                openProjectBoard(targ.dataset.id, targ.dataset.title, targ.dataset.desc);
            });
        });

    } catch (err) {
        projectsGrid.innerHTML = '<p style="color: #ef4444;">Failed to load projects.</p>';
    }
}

// Modals Handling
function openModal(modalEl) {
    modalOverlay.classList.remove('hidden');
    modalEl.classList.remove('hidden');
}

function closeAllModals() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

btnCreateProject.addEventListener('click', () => openModal(modalProject));
closeProjectModal.addEventListener('click', closeAllModals);
modalOverlay.addEventListener('click', closeAllModals);

formProject.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('proj-title').value;
    const desc = document.getElementById('proj-desc').value;

    try {
        const res = await fetch(`${API_URL}/api/projects`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify({ title, description: desc })
        });
        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Success', text: 'Project Created', timer: 1500, showConfirmButton: false });
            closeAllModals();
            formProject.reset();
            loadDashboard();
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Creation failed' });
    }
});


// === Project Board (Kanban) ===
async function openProjectBoard(id, title, desc) {
    currentProjectId = id;
    pageTitle.innerText = title;
    projectDescHeader.innerText = desc || 'Manage your project tasks here.';
    
    // Hide create project button on board
    btnCreateProject.classList.add('hidden');

    // Manage Views
    dashboardContent.classList.add('hidden');
    projectBoardContent.classList.remove('hidden');

    loadTasks();
}

btnCreateTask.addEventListener('click', () => openModal(modalTask));
closeTaskModal.addEventListener('click', closeAllModals);

formTask.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProjectId) return;

    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const assignee = document.getElementById('task-assignee').value;

    try {
        const res = await fetch(`${API_URL}/api/projects/${currentProjectId}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify({ title, description: desc, assignee_id: assignee || null })
        });
        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Task Added', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
            closeAllModals();
            formTask.reset();
            loadTasks();
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not create task' });
    }
});

async function loadTasks() {
    listTodo.innerHTML = '';
    listInprogress.innerHTML = '';
    listDone.innerHTML = '';
    countTodo.innerText = '0';
    countInprogress.innerText = '0';
    countDone.innerText = '0';

    try {
        const res = await fetch(`${API_URL}/api/projects/${currentProjectId}/tasks`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const tasks = await res.json();
        
        let cTodo = 0, cProg = 0, cDone = 0;

        tasks.forEach(t => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.id = t.id;
            card.innerHTML = `
                <h4>${t.title}</h4>
                <div class="task-meta-card">
                    <span class="text-muted"><i class='bx bx-message-rounded-dots'></i> View</span>
                    ${t.assignee_name ? `<span class="badge"><i class='bx bx-user'></i> ${t.assignee_name}</span>` : ''}
                </div>
            `;
            
            // Drag and Drop events
            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // Click to view details
            card.addEventListener('click', () => openTaskDetails(t));

            if (t.status === 'todo') {
                listTodo.appendChild(card);
                cTodo++;
            } else if (t.status === 'in-progress') {
                listInprogress.appendChild(card);
                cProg++;
            } else {
                listDone.appendChild(card);
                cDone++;
            }
        });

        countTodo.innerText = cTodo;
        countInprogress.innerText = cProg;
        countDone.innerText = cDone;

    } catch (e) {
        console.error('Failed to load tasks', e);
    }
}

// Drag & Drop Setup
document.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        column.style.background = 'rgba(255, 255, 255, 0.05)';
    });
    
    column.addEventListener('dragleave', () => {
        column.style.background = 'rgba(30, 41, 59, 0.4)';
    });

    column.addEventListener('drop', async e => {
        e.preventDefault();
        column.style.background = 'rgba(30, 41, 59, 0.4)';
        
        const card = document.querySelector('.dragging');
        if (!card) return;

        const newStatus = column.dataset.status;
        const targetList = column.querySelector('.task-list');
        targetList.appendChild(card);
        
        const taskId = card.dataset.id;
        
        // Update via API
        try {
            await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}` 
                },
                body: JSON.stringify({ status: newStatus })
            });
            // Reload counts immediately (small visual glitch fix)
            loadTasks();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not update task status.' });
            loadTasks(); // revert visually
        }
    });
});


// === Task Details & Comments ===
const detailTaskTitle = document.getElementById('detail-task-title');
const detailTaskStatus = document.getElementById('detail-task-status');
const detailTaskAssignee = document.getElementById('detail-task-assignee');
const detailTaskDesc = document.getElementById('detail-task-desc');
const commentsList = document.getElementById('comments-list');

async function openTaskDetails(task) {
    currentTaskId = task.id;
    detailTaskTitle.innerText = task.title;
    detailTaskStatus.innerText = task.status;
    detailTaskAssignee.innerText = task.assignee_name || 'Unassigned';
    detailTaskDesc.innerHTML = task.description ? task.description.replace(/\n/g, '<br>') : '<i>No description</i>';
    
    // Status colors
    if(task.status === 'todo') detailTaskStatus.style.color = 'var(--status-todo)';
    if(task.status === 'in-progress') detailTaskStatus.style.color = 'var(--status-inprogress)';
    if(task.status === 'done') detailTaskStatus.style.color = 'var(--status-done)';

    openModal(modalTaskDetails);
    loadComments();
}

closeDetailsModal.addEventListener('click', closeAllModals);

async function loadComments() {
    commentsList.innerHTML = '<p class="text-muted">Loading...</p>';
    try {
        const res = await fetch(`${API_URL}/api/tasks/${currentTaskId}/comments`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const comments = await res.json();
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No comments yet.</p>';
            return;
        }

        commentsList.innerHTML = '';
        comments.forEach(c => {
            const d = new Date(c.created_at).toLocaleString();
            commentsList.innerHTML += `
                <div class="comment">
                    <div class="comment-author">${c.username} <span style="font-weight:400; color:var(--text-muted); font-size:0.75rem">(${d})</span></div>
                    <div class="comment-text">${c.content}</div>
                </div>
            `;
        });
        
        // Scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;

    } catch (e) {
        commentsList.innerHTML = '<p style="color:#ef4444">Failed to load comments</p>';
    }
}

formComment.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_URL}/api/tasks/${currentTaskId}/comments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            input.value = '';
            loadComments(); // Refresh comment list
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not post comment' });
    }
});
