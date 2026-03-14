// ════════════════════════════════════════
// APP STATE
// ════════════════════════════════════════
const appState = {
    fileHistory: [],      // { id, name, size, type:'encrypted'|'decrypted', date }
    activityLog: [],      // { action, filename, time }
    settings: {
        minPassLength: 6,
        autoClear: true,
        showStrength: true,
        theme: 'natural',
        reduceMotion: false,
        saveHistory: true
    },
    currentUser: null
};

// ════════════════════════════════════════
// PAGE NAVIGATION
// ════════════════════════════════════════
function switchPage(page) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active-page');

    const link = document.querySelector(`.nav-links a[data-page="${page}"]`);
    if (link) link.classList.add('active');

    // Refresh dynamic pages
    if (page === 'files')    renderFilesPage();
    if (page === 'activity') renderActivityPage();
    if (page === 'settings') loadSettingsPage();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        switchPage(link.dataset.page);
    });
});

document.getElementById('navBrandLink').addEventListener('click', e => {
    e.preventDefault();
    switchPage('dashboard');
});

// ════════════════════════════════════════
// LOGIN / REGISTER / NAV
// ════════════════════════════════════════
const DEMO_USER = { email: 'demo@encryptify.app', password: 'demo1234', name: 'Demo User' };
const userStore = [{ ...DEMO_USER }];

const loginScreen   = document.getElementById('loginScreen');
const registerModal = document.getElementById('registerModal');
const loginBtn      = document.getElementById('loginBtn');
const loginError    = document.getElementById('loginError');

document.getElementById('openRegisterBtn').addEventListener('click', e => {
    e.preventDefault();
    registerModal.classList.add('visible');
    clearRegisterForm();
});
document.getElementById('closeRegisterBtn').addEventListener('click', () => registerModal.classList.remove('visible'));
document.getElementById('backToLoginBtn').addEventListener('click', e => { e.preventDefault(); registerModal.classList.remove('visible'); });
registerModal.addEventListener('click', e => { if (e.target === registerModal) registerModal.classList.remove('visible'); });

document.getElementById('registerBtn').addEventListener('click', () => {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirmPassword').value;
    const agreed    = document.getElementById('agreeTerms').checked;
    const errorEl   = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    errorEl.style.display = 'none'; successEl.style.display = 'none';
    if (!firstName || !lastName)            return showRegisterError('Please enter your first and last name.');
    if (!email || !email.includes('@'))     return showRegisterError('Please enter a valid email address.');
    if (password.length < 6)               return showRegisterError('Password must be at least 6 characters.');
    if (password !== confirm)              return showRegisterError('Passwords do not match.');
    if (!agreed)                           return showRegisterError('Please agree to the Terms of Service.');
    if (userStore.find(u => u.email === email)) return showRegisterError('An account with this email already exists.');
    const newUser = { email, password, name: `${firstName} ${lastName}` };
    userStore.push(newUser);
    successEl.textContent = `🎉 Account created! Welcome, ${firstName}! Signing you in...`;
    successEl.style.display = 'block';
    setTimeout(() => { registerModal.classList.remove('visible'); loginWithUser(newUser); }, 1800);
});

function showRegisterError(msg) {
    const el = document.getElementById('registerError');
    el.textContent = msg; el.style.display = 'block';
}
function clearRegisterForm() {
    ['regFirstName','regLastName','regEmail','regPassword','regConfirmPassword'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('agreeTerms').checked = false;
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

function attemptLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    const user  = userStore.find(u => u.email === email && u.password === pass);
    if (user) {
        loginError.style.display = 'none';
        loginWithUser(user);
    } else {
        loginError.style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function loginWithUser(user) {
    appState.currentUser = user;
    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('dropdownName').textContent   = user.name;
    document.getElementById('dropdownEmail').textContent  = user.email;
    // Pre-fill settings name/email
    document.getElementById('settingName').value  = user.name;
    document.getElementById('settingEmail').value = user.email;
    loginScreen.classList.add('hidden');
    switchPage('dashboard');
}

loginBtn.addEventListener('click', attemptLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
document.getElementById('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginPassword').focus(); });

document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    appState.currentUser = null;
    loginScreen.classList.remove('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    switchPage('dashboard');
});

// ════════════════════════════════════════
// DASHBOARD — ENCRYPT / DECRYPT
// ════════════════════════════════════════
let encryptFileData = null;
let decryptFileData = null;

const encryptUpload      = document.getElementById('encryptUpload');
const encryptFileInput   = document.getElementById('encryptFile');
const encryptFileDisplay = document.getElementById('encryptFileDisplay');
const encryptFileName    = document.getElementById('encryptFileName');
const encryptFileSize    = document.getElementById('encryptFileSize');
const encryptPasswordEl  = document.getElementById('encryptPassword');
const encryptBtn         = document.getElementById('encryptBtn');
const encryptStrength    = document.getElementById('encryptStrength');

const decryptUpload      = document.getElementById('decryptUpload');
const decryptFileInput   = document.getElementById('decryptFile');
const decryptFileDisplay = document.getElementById('decryptFileDisplay');
const decryptFileName    = document.getElementById('decryptFileName');
const decryptFileSize    = document.getElementById('decryptFileSize');
const decryptPasswordEl  = document.getElementById('decryptPassword');
const decryptBtn         = document.getElementById('decryptBtn');

const statusContainer = document.getElementById('statusContainer');
const progressBar     = document.getElementById('progressBar');
const progressFill    = document.getElementById('progressFill');

// Upload listeners
encryptUpload.addEventListener('click', () => encryptFileInput.click());
encryptUpload.addEventListener('dragover', e => { e.preventDefault(); encryptUpload.classList.add('dragover'); });
encryptUpload.addEventListener('dragleave', () => encryptUpload.classList.remove('dragover'));
encryptUpload.addEventListener('drop', e => { e.preventDefault(); encryptUpload.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) handleEncryptFile(e.dataTransfer.files[0]); });
encryptFileInput.addEventListener('change', e => { if (e.target.files.length > 0) handleEncryptFile(e.target.files[0]); });

decryptUpload.addEventListener('click', () => decryptFileInput.click());
decryptUpload.addEventListener('dragover', e => { e.preventDefault(); decryptUpload.classList.add('dragover'); });
decryptUpload.addEventListener('dragleave', () => decryptUpload.classList.remove('dragover'));
decryptUpload.addEventListener('drop', e => { e.preventDefault(); decryptUpload.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) handleDecryptFile(e.dataTransfer.files[0]); });
decryptFileInput.addEventListener('change', e => { if (e.target.files.length > 0) handleDecryptFile(e.target.files[0]); });

// Password strength indicator
encryptPasswordEl.addEventListener('input', () => {
    if (!appState.settings.showStrength) { encryptStrength.textContent = ''; return; }
    const val = encryptPasswordEl.value;
    if (!val) { encryptStrength.textContent = ''; return; }
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        { cls: 'strength-weak',   label: '⚠ Weak' },
        { cls: 'strength-weak',   label: '⚠ Weak' },
        { cls: 'strength-fair',   label: '◑ Fair' },
        { cls: 'strength-good',   label: '✓ Good' },
        { cls: 'strength-strong', label: '✦ Strong' },
        { cls: 'strength-strong', label: '✦ Strong' },
    ];
    const lvl = levels[score] || levels[0];
    encryptStrength.className = `password-strength ${lvl.cls}`;
    encryptStrength.textContent = lvl.label;
});

function handleEncryptFile(file) {
    if (file.type !== 'application/pdf') { showStatus('error', '🚫 Please select a valid PDF file'); return; }
    encryptFileData = file;
    encryptFileName.textContent = file.name;
    encryptFileSize.textContent = formatFileSize(file.size);
    encryptFileDisplay.classList.add('active');
    encryptBtn.disabled = false;
    showStatus('success', `✓ ${file.name} is ready to protect`);
}

function handleDecryptFile(file) {
    if (file.type !== 'application/pdf') { showStatus('error', '🚫 Please select a valid PDF file'); return; }
    decryptFileData = file;
    decryptFileName.textContent = file.name;
    decryptFileSize.textContent = formatFileSize(file.size);
    decryptFileDisplay.classList.add('active');
    decryptBtn.disabled = false;
    showStatus('success', `✓ ${file.name} is ready to unlock`);
}

encryptBtn.addEventListener('click', async () => {
    const password = encryptPasswordEl.value;
    const minLen   = appState.settings.minPassLength;
    if (!password) { showStatus('error', '🔑 Please enter a password to protect your PDF'); return; }
    if (password.length < minLen) { showStatus('error', `🔑 Password must be at least ${minLen} characters long`); return; }
    try {
        showStatus('processing', '🌿 Protecting your PDF...');
        progressBar.classList.add('active');
        updateProgress(30);
        const arrayBuffer = await encryptFileData.arrayBuffer();
        updateProgress(50);
        const base64 = arrayBufferToBase64(arrayBuffer);
        updateProgress(70);
        const encrypted = CryptoJS.AES.encrypt(base64, password).toString();
        updateProgress(90);
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const outName = encryptFileData.name.replace('.pdf', '_protected.pdf');
        downloadFile(blob, outName);
        updateProgress(100);
        // Save to history
        addFileToHistory({ name: outName, size: blob.size, type: 'encrypted', originalName: encryptFileData.name });
        addActivityLog('🔒 Encrypted', outName);
        if (appState.settings.autoClear) encryptPasswordEl.value = '';
        encryptStrength.textContent = '';
        setTimeout(() => {
            showStatus('success', `🎉 Your PDF is now protected!`, outName);
            progressBar.classList.remove('active');
            updateProgress(0);
        }, 500);
    } catch (error) {
        showStatus('error', `❌ Protection failed: ${error.message}`);
        progressBar.classList.remove('active');
        updateProgress(0);
    }
});

decryptBtn.addEventListener('click', async () => {
    const password = decryptPasswordEl.value;
    if (!password) { showStatus('error', '🔑 Please enter the password to unlock your PDF'); return; }
    try {
        showStatus('processing', '🔓 Unlocking your PDF...');
        progressBar.classList.add('active');
        updateProgress(30);
        const encryptedText = await decryptFileData.text();
        updateProgress(50);
        const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
        const base64 = decrypted.toString(CryptoJS.enc.Utf8);
        if (!base64) throw new Error('Invalid password or corrupted file');
        updateProgress(70);
        const arrayBuffer = base64ToArrayBuffer(base64);
        updateProgress(90);
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const outName = decryptFileData.name.replace('_protected', '_unlocked');
        downloadFile(blob, outName);
        updateProgress(100);
        addFileToHistory({ name: outName, size: blob.size, type: 'decrypted', originalName: decryptFileData.name });
        addActivityLog('🔓 Decrypted', outName);
        if (appState.settings.autoClear) decryptPasswordEl.value = '';
        setTimeout(() => {
            showStatus('success', `🎉 Your PDF is unlocked!`, outName);
            progressBar.classList.remove('active');
            updateProgress(0);
        }, 500);
    } catch (error) {
        showStatus('error', `❌ Unlock failed: Wrong password or corrupted file`);
        progressBar.classList.remove('active');
        updateProgress(0);
    }
});

// ════════════════════════════════════════
// HISTORY & ACTIVITY HELPERS
// ════════════════════════════════════════
function addFileToHistory({ name, size, type, originalName }) {
    if (!appState.settings.saveHistory) return;
    appState.fileHistory.unshift({
        id: Date.now(),
        name, size, type, originalName,
        date: new Date().toLocaleString()
    });
}

function addActivityLog(action, filename) {
    appState.activityLog.unshift({
        action, filename,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date()
    });
}

// ════════════════════════════════════════
// MY FILES PAGE
// ════════════════════════════════════════
let activeFilter = 'all';
let searchQuery  = '';

function renderFilesPage() {
    const grid  = document.getElementById('filesGrid');
    const empty = document.getElementById('filesEmpty');

    let files = appState.fileHistory;
    if (activeFilter !== 'all')  files = files.filter(f => f.type === activeFilter);
    if (searchQuery.trim())      files = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    grid.innerHTML = '';
    if (files.length === 0) {
        grid.style.display = 'none';
        empty.classList.add('visible');
        return;
    }
    grid.style.display = 'grid';
    empty.classList.remove('visible');

    files.forEach((file, i) => {
        const card = document.createElement('div');
        card.className = `file-card type-${file.type}`;
        card.style.animationDelay = `${i * 0.06}s`;
        card.innerHTML = `
            <div class="file-card-icon">${file.type === 'encrypted' ? '🔒' : '🔓'}</div>
            <div class="file-card-name">${file.name}</div>
            <div class="file-card-meta">
                <span>${formatFileSize(file.size)}</span>
                <span>${file.date}</span>
            </div>
            <span class="file-card-badge badge-${file.type}">${file.type === 'encrypted' ? '🔒 Encrypted' : '🔓 Decrypted'}</span>
        `;
        grid.appendChild(card);
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderFilesPage();
    });
});

document.getElementById('filesSearch').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderFilesPage();
});

// ════════════════════════════════════════
// ACTIVITY PAGE
// ════════════════════════════════════════
function renderActivityPage() {
    const enc   = appState.fileHistory.filter(f => f.type === 'encrypted').length;
    const dec   = appState.fileHistory.filter(f => f.type === 'decrypted').length;
    const total = appState.fileHistory.length;
    const today = appState.fileHistory.filter(f => {
        const d = new Date(f.date);
        const n = new Date();
        return d.toDateString() === n.toDateString();
    }).length;

    document.getElementById('statEncrypted').textContent = enc;
    document.getElementById('statDecrypted').textContent = dec;
    document.getElementById('statTotal').textContent     = total;
    document.getElementById('statToday').textContent     = today;

    const log = document.getElementById('activityLog');
    if (appState.activityLog.length === 0) {
        log.innerHTML = '<div class="activity-empty">No activity yet. Start encrypting or decrypting files!</div>';
        return;
    }
    log.innerHTML = appState.activityLog.map(item => `
        <div class="activity-item">
            <div class="activity-dot ${item.action.includes('Encrypted') || item.action.includes('🔒') ? 'dot-encrypt' : 'dot-decrypt'}">${item.action.split(' ')[0]}</div>
            <div class="activity-info">
                <div class="activity-action">${item.action}</div>
                <div class="activity-filename">${item.filename}</div>
            </div>
            <div class="activity-time">${item.time}</div>
        </div>
    `).join('');
}

document.getElementById('clearLogBtn').addEventListener('click', () => {
    appState.activityLog = [];
    renderActivityPage();
});

// ════════════════════════════════════════
// SETTINGS PAGE
// ════════════════════════════════════════
function loadSettingsPage() {
    if (appState.currentUser) {
        document.getElementById('settingName').value  = appState.currentUser.name;
        document.getElementById('settingEmail').value = appState.currentUser.email;
    }
    document.getElementById('settingMinPass').value      = appState.settings.minPassLength;
    document.getElementById('settingAutoClear').checked  = appState.settings.autoClear;
    document.getElementById('settingPassStrength').checked = appState.settings.showStrength;
    document.getElementById('settingTheme').value        = appState.settings.theme;
    document.getElementById('settingReduceMotion').checked = appState.settings.reduceMotion;
    document.getElementById('settingHistory').checked    = appState.settings.saveHistory;
}

document.getElementById('saveAccountBtn').addEventListener('click', () => {
    const name  = document.getElementById('settingName').value.trim();
    const email = document.getElementById('settingEmail').value.trim();
    if (!name)  return showSettingsToast('⚠ Please enter a display name.');
    if (!email) return showSettingsToast('⚠ Please enter an email address.');
    if (appState.currentUser) {
        appState.currentUser.name  = name;
        appState.currentUser.email = email;
        const initials = name.split(' ').map(w => w[0]).join('').toUpperCase();
        document.getElementById('avatarInitials').textContent = initials;
        document.getElementById('dropdownName').textContent   = name;
        document.getElementById('dropdownEmail').textContent  = email;
    }
    showSettingsToast('✓ Account details saved!');
});

document.getElementById('settingMinPass').addEventListener('change', e => {
    appState.settings.minPassLength = parseInt(e.target.value);
    showSettingsToast('✓ Security settings updated.');
});
document.getElementById('settingAutoClear').addEventListener('change', e => {
    appState.settings.autoClear = e.target.checked;
});
document.getElementById('settingPassStrength').addEventListener('change', e => {
    appState.settings.showStrength = e.target.checked;
    if (!e.target.checked) encryptStrength.textContent = '';
});
document.getElementById('settingTheme').addEventListener('change', e => {
    appState.settings.theme = e.target.value;
    applyTheme(e.target.value);
    showSettingsToast('✓ Theme applied!');
});
document.getElementById('settingReduceMotion').addEventListener('change', e => {
    appState.settings.reduceMotion = e.target.checked;
    document.body.style.setProperty('--anim-speed', e.target.checked ? '0.01s' : '');
    showSettingsToast(e.target.checked ? '✓ Animations reduced.' : '✓ Animations restored.');
});
document.getElementById('settingHistory').addEventListener('change', e => {
    appState.settings.saveHistory = e.target.checked;
});
document.getElementById('clearAllDataBtn').addEventListener('click', () => {
    if (confirm('Clear all file history and activity logs? This cannot be undone.')) {
        appState.fileHistory  = [];
        appState.activityLog  = [];
        showSettingsToast('🗑 All data cleared.');
    }
});

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'ocean') {
        root.style.setProperty('--sage',       '#7aaccf');
        root.style.setProperty('--forest',     '#2e6d9e');
        root.style.setProperty('--deep-green', '#1a3f5c');
        root.style.setProperty('--terracotta', '#5bc4c4');
        root.style.setProperty('--earth',      '#4a7a8a');
        root.style.setProperty('--clay',       '#88c4d8');
    } else if (theme === 'dusk') {
        root.style.setProperty('--sage',       '#c4a0c8');
        root.style.setProperty('--forest',     '#7b4d8a');
        root.style.setProperty('--deep-green', '#4a2060');
        root.style.setProperty('--terracotta', '#e88a7a');
        root.style.setProperty('--earth',      '#8a5568');
        root.style.setProperty('--clay',       '#d4a8b8');
    } else {
        root.style.setProperty('--sage',       '#9caf88');
        root.style.setProperty('--forest',     '#5a7355');
        root.style.setProperty('--deep-green', '#3d5a3d');
        root.style.setProperty('--terracotta', '#d4a373');
        root.style.setProperty('--earth',      '#8b7355');
        root.style.setProperty('--clay',       '#c8a882');
    }
}

function showSettingsToast(msg) {
    const toast = document.getElementById('settingsToast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function showStatus(type, message, filename = null) {
    const icons = { success: '✨', error: '🚫', processing: '⏳' };
    statusContainer.className = 'status-container ' + type;
    statusContainer.innerHTML = `
        <div class="status-icon">${icons[type]}</div>
        <div class="status-text">${message}</div>
    `;
    if (type === 'success' && filename) {
        const note = document.createElement('div');
        note.className = 'status-text';
        note.style.cssText = 'margin-top:10px;font-size:0.95rem;';
        note.textContent = `Downloaded as: ${filename}`;
        statusContainer.appendChild(note);
    }
    statusContainer.appendChild(progressBar);
    if (type !== 'processing') progressBar.classList.remove('active');
}
function updateProgress(percent) {
    progressFill.style.width = percent + '%';
}