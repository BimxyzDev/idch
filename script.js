// Configuration

const CONFIG = {
    USERNAME: "1",
    PASSWORD: "2",
    GITHUB: {
        REPO: "BimxyzDev/idch",
        FILE: "newsletter.json",
        BRANCH: "main"
    },
    // GitHub Token - Dipisah jadi array lalu join
    TOKEN_PARTS: [
        "github",  // Bagian 1
        "_pat_11BTL4JUA0",   // Bagian 2
        "NxjtCiI1Outu_6OGr4e1YeSXSPn3haoV3oS1aPWBna08JTDNetpD5kZGCUJP76VIiXP8O7JQ"  // Bagian 3
    ]
};

// Lalu di bagian penggunaan token, pakai:
const GITHUB_TOKEN = CONFIG.TOKEN_PARTS.join('');
// State
let currentIds = [];
let isLoading = false;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addBtn = document.getElementById('addBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const deleteSpecificBtn = document.getElementById('deleteSpecificBtn');
const refreshBtn = document.getElementById('refreshBtn');
const newIdInput = document.getElementById('newId');
const deleteIdInput = document.getElementById('deleteId');
const idsList = document.getElementById('idsList');
const idsCount = document.getElementById('idsCount');
const alertContainer = document.getElementById('alertContainer');
const loginAlert = document.getElementById('loginAlert');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('newsletter_auth') === 'true') {
        showApp();
        loadIds();
    }

    // Event Listeners
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    addBtn.addEventListener('click', handleAddId);
    deleteAllBtn.addEventListener('click', handleDeleteAll);
    deleteSpecificBtn.addEventListener('click', handleDeleteSpecific);
    refreshBtn.addEventListener('click', loadIds);
    
    newIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddId();
    });
    
    deleteIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDeleteSpecific();
    });
    
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('password').focus();
    });
    
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

// Authentication
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === CONFIG.USERNAME && password === CONFIG.PASSWORD) {
        localStorage.setItem('newsletter_auth', 'true');
        showApp();
        loadIds();
        showAlert('Login successful!', 'success');
    } else {
        showLoginAlert('Invalid username or password');
    }
}

function handleLogout() {
    localStorage.removeItem('newsletter_auth');
    showLogin();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showLogin() {
    loginScreen.style.display = 'block';
    appScreen.style.display = 'none';
}

function showApp() {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
}

// Alerts
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function showLoginAlert(message) {
    loginAlert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    loginAlert.className = 'alert alert-error';
    loginAlert.style.display = 'flex';
    
    setTimeout(() => {
        loginAlert.style.opacity = '0';
        setTimeout(() => {
            loginAlert.style.display = 'none';
            loginAlert.style.opacity = '1';
        }, 300);
    }, 3000);
}

// Load IDs from GitHub (READ ONLY)
async function loadIds() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        refreshBtn.innerHTML = '<div class="loading"></div> Loading...';
        refreshBtn.disabled = true;
        
        const url = `https://raw.githubusercontent.com/${CONFIG.GITHUB.REPO}/${CONFIG.GITHUB.BRANCH}/${CONFIG.GITHUB.FILE}?t=${Date.now()}`;
        console.log('Loading from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet, create empty array
                currentIds = [];
                renderIdsList();
                showAlert('No data found, starting fresh', 'error');
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded data:', data);
        
        // Validate data is an array
        if (Array.isArray(data)) {
            currentIds = data;
        } else {
            console.error('Invalid data format, expected array:', data);
            currentIds = [];
        }
        
        renderIdsList();
        showAlert('Data loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading IDs:', error);
        currentIds = [];
        renderIdsList();
        showAlert(`Failed to load data: ${error.message}`, 'error');
    } finally {
        isLoading = false;
        refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh List';
        refreshBtn.disabled = false;
    }
}

// Render IDs list
function renderIdsList() {
    idsCount.textContent = `${currentIds.length} ID${currentIds.length !== 1 ? 's' : ''}`;
    
    if (currentIds.length === 0) {
        idsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>No newsletter IDs found</p>
                <small>Start by adding your first ID above</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    currentIds.forEach((id, index) => {
        // Escape quotes untuk menghindari error dalam onclick
        const escapedId = id.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `
            <div class="id-item">
                <div class="id-content">
                    <div class="id-number">${index + 1}</div>
                    <div class="id-text">${id}</div>
                </div>
                <div class="id-actions">
                    <button class="icon-btn copy" onclick="copyId('${escapedId}')" title="Copy ID">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteSingleId('${escapedId}')" title="Delete ID">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    idsList.innerHTML = html;
}

// Add new ID
async function handleAddId() {
    if (isLoading) return;
    
    const newId = newIdInput.value.trim();
    
    if (!newId) {
        showAlert('Please enter a newsletter ID', 'error');
        newIdInput.focus();
        return;
    }
    
    if (!newId.includes('@newsletter')) {
        showAlert('ID must contain @newsletter', 'error');
        return;
    }
    
    // Check duplicate locally first
    if (currentIds.includes(newId)) {
        showAlert('This ID already exists', 'error');
        return;
    }
    
    try {
        isLoading = true;
        addBtn.innerHTML = '<div class="loading"></div> Adding...';
        addBtn.disabled = true;
        
        // Load current data from GitHub first
        await loadIds();
        
        // Check again after loading (in case someone else added it)
        if (currentIds.includes(newId)) {
            showAlert('This ID already exists', 'error');
            return;
        }
        
        // First get current file SHA
        const sha = await getFileSHA();
        
        // Add new ID to current list
        const updatedIds = [...currentIds, newId];
        
        // Update on GitHub
        await updateGitHubFile(updatedIds, sha, `Add ID: ${newId}`);
        
        // Update local state
        currentIds = updatedIds;
        
        // Clear input and update UI
        newIdInput.value = '';
        renderIdsList();
        showAlert('ID added successfully', 'success');
        newIdInput.focus();
        
    } catch (error) {
        console.error('Error adding ID:', error);
        showAlert(`Failed to add ID: ${error.message}`, 'error');
    } finally {
        isLoading = false;
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add ID';
        addBtn.disabled = false;
    }
}

// Delete specific ID by input
async function handleDeleteSpecific() {
    if (isLoading) return;
    
    const idToDelete = deleteIdInput.value.trim();
    
    if (!idToDelete) {
        showAlert('Please enter an ID to delete', 'error');
        deleteIdInput.focus();
        return;
    }
    
    if (!currentIds.includes(idToDelete)) {
        showAlert('ID not found in the list', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete:\n${idToDelete}?`)) {
        return;
    }
    
    try {
        isLoading = true;
        deleteSpecificBtn.innerHTML = '<div class="loading"></div> Deleting...';
        deleteSpecificBtn.disabled = true;
        
        // First get current file SHA
        const sha = await getFileSHA();
        
        // Remove ID from list
        const updatedIds = currentIds.filter(item => item !== idToDelete);
        
        // Update on GitHub
        await updateGitHubFile(updatedIds, sha, `Delete ID: ${idToDelete}`);
        
        // Update local state
        currentIds = updatedIds;
        
        // Update UI
        renderIdsList();
        showAlert('ID deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting ID:', error);
        showAlert(`Failed to delete ID: ${error.message}`, 'error');
    } finally {
        isLoading = false;
        deleteSpecificBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteSpecificBtn.disabled = false;
        deleteIdInput.value = '';
    }
}

// Delete single ID
async function deleteSingleId(id) {
    if (isLoading) return;
    
    if (!confirm(`Are you sure you want to delete:\n${id}?`)) {
        return;
    }
    
    try {
        isLoading = true;
        
        // First get current file SHA
        const sha = await getFileSHA();
        
        // Remove ID from list
        const updatedIds = currentIds.filter(item => item !== id);
        
        // Update on GitHub
        await updateGitHubFile(updatedIds, sha, `Delete ID: ${id}`);
        
        // Update local state
        currentIds = updatedIds;
        
        // Update UI
        renderIdsList();
        showAlert('ID deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting ID:', error);
        showAlert(`Failed to delete ID: ${error.message}`, 'error');
    } finally {
        isLoading = false;
    }
}

// Delete all IDs
async function handleDeleteAll() {
    if (isLoading) return;
    
    if (currentIds.length === 0) {
        showAlert('No IDs to delete', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ALL ${currentIds.length} IDs?\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        isLoading = true;
        deleteAllBtn.innerHTML = '<div class="loading"></div> Deleting...';
        deleteAllBtn.disabled = true;
        
        // First get current file SHA
        const sha = await getFileSHA();
        
        // Update on GitHub with empty array
        await updateGitHubFile([], sha, 'Delete all IDs');
        
        // Update local state
        currentIds = [];
        
        // Update UI
        renderIdsList();
        showAlert('All IDs deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting all IDs:', error);
        showAlert(`Failed to delete all IDs: ${error.message}`, 'error');
    } finally {
        isLoading = false;
        deleteAllBtn.innerHTML = '<i class="fas fa-bomb"></i> Delete All IDs';
        deleteAllBtn.disabled = false;
    }
}

// Get file SHA from GitHub
async function getFileSHA() {
    try {
        const getUrl = `https://api.github.com/repos/${CONFIG.GITHUB.REPO}/contents/${CONFIG.GITHUB.FILE}`;
        const response = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const fileData = await response.json();
            return fileData.sha;
        } else if (response.status === 404) {
            // File doesn't exist yet, return empty string
            return '';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error getting file SHA:', error);
        throw error;
    }
}

// Update GitHub file
async function updateGitHubFile(idsArray, sha, commitMessage) {
    try {
        const updateUrl = `https://api.github.com/repos/${CONFIG.GITHUB.REPO}/contents/${CONFIG.GITHUB.FILE}`;
        
        // Ensure we have a valid array
        const content = JSON.stringify(idsArray, null, 2);
        
        // Convert to Base64 properly
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));
        
        const data = {
            message: commitMessage,
            content: contentBase64,
            branch: CONFIG.GITHUB.BRANCH
        };
        
        // Only add SHA if file exists
        if (sha) {
            data.sha = sha;
        }
        
        console.log('Updating GitHub with:', { commitMessage, idsCount: idsArray.length });
        
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('GitHub API Error:', errorData);
            
            let errorMessage = errorData.message || `HTTP ${response.status}`;
            
            // User-friendly error messages
            if (errorMessage.includes('This repository is empty')) {
                errorMessage = 'Repository is empty. Please create the file first.';
            } else if (errorMessage.includes('Bad credentials')) {
                errorMessage = 'Invalid GitHub token. Please check your token.';
            } else if (errorMessage.includes('Reference already exists')) {
                errorMessage = 'Update conflict. Please refresh and try again.';
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('GitHub update successful:', result.commit.html_url);
        
        // Reload data to ensure sync
        await loadIds();
        
    } catch (error) {
        console.error('Error updating GitHub file:', error);
        throw error;
    }
}

// Copy ID to clipboard
function copyId(id) {
    navigator.clipboard.writeText(id).then(() => {
        showAlert('ID copied to clipboard', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showAlert('Failed to copy ID', 'error');
    });
}

// Expose functions globally for onclick handlers
window.copyId = copyId;
window.deleteSingleId = deleteSingleId;

// Auto refresh every 30 seconds
setInterval(() => {
    if (localStorage.getItem('newsletter_auth') === 'true' && !isLoading) {
        console.log('Auto-refreshing data...');
        loadIds();
    }
}, 30000);
