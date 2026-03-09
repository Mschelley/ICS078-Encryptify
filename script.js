// ════════════════════════════════════════
// LOGIN, REGISTER & NAV
// ════════════════════════════════════════

const DEMO_USER = { email: 'demo@encryptify.app', password: 'demo1234', name: 'Demo User' };

// In-memory user store (simulates a database for this demo)
const userStore = [{ ...DEMO_USER }];

const loginScreen   = document.getElementById('loginScreen');
const registerModal = document.getElementById('registerModal');
const loginBtn      = document.getElementById('loginBtn');
const loginError    = document.getElementById('loginError');

// ── Open / close register modal ───────────────────────────────────────────
document.getElementById('openRegisterBtn').addEventListener('click', e => {
    e.preventDefault();
    registerModal.classList.add('visible');
    clearRegisterForm();
});

document.getElementById('closeRegisterBtn').addEventListener('click', () => {
    registerModal.classList.remove('visible');
});

document.getElementById('backToLoginBtn').addEventListener('click', e => {
    e.preventDefault();
    registerModal.classList.remove('visible');
});

// Close modal when clicking the backdrop
registerModal.addEventListener('click', e => {
    if (e.target === registerModal) registerModal.classList.remove('visible');
});

// ── Register logic ────────────────────────────────────────────────────────
document.getElementById('registerBtn').addEventListener('click', () => {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirmPassword').value;
    const agreed    = document.getElementById('agreeTerms').checked;
    const errorEl   = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');

    errorEl.style.display   = 'none';
    successEl.style.display = 'none';

    // Validation
    if (!firstName || !lastName)  return showRegisterError('Please enter your first and last name.');
    if (!email || !email.includes('@')) return showRegisterError('Please enter a valid email address.');
    if (password.length < 6)      return showRegisterError('Password must be at least 6 characters.');
    if (password !== confirm)     return showRegisterError('Passwords do not match.');
    if (!agreed)                  return showRegisterError('Please agree to the Terms of Service.');

    // Check duplicate email
    if (userStore.find(u => u.email === email)) return showRegisterError('An account with this email already exists.');

    // Save new user
    const newUser = { email, password, name: `${firstName} ${lastName}` };
    userStore.push(newUser);

    // Show success, then auto-login after 1.8s
    successEl.textContent = `🎉 Account created! Welcome, ${firstName}! Signing you in...`;
    successEl.style.display = 'block';

    setTimeout(() => {
        registerModal.classList.remove('visible');
        loginWithUser(newUser);
    }, 1800);
});

function showRegisterError(msg) {
    const el = document.getElementById('registerError');
    el.textContent     = msg;
    el.style.display   = 'block';
}

function clearRegisterForm() {
    ['regFirstName', 'regLastName', 'regEmail', 'regPassword', 'regConfirmPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('agreeTerms').checked          = false;
    document.getElementById('registerError').style.display  = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

// ── Login logic ───────────────────────────────────────────────────────────
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
    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('dropdownName').textContent   = user.name;
    document.getElementById('dropdownEmail').textContent  = user.email;
    loginScreen.classList.add('hidden');
}

loginBtn.addEventListener('click', attemptLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
});
document.getElementById('loginEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPassword').focus();
});

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    loginScreen.classList.remove('hidden');
    document.getElementById('loginEmail').value    = '';
    document.getElementById('loginPassword').value = '';
});

// ── Nav active links ──────────────────────────────────────────────────────
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// ════════════════════════════════════════
// ORIGINAL SCRIPT
// ════════════════════════════════════════

let encryptFileData = null;
let decryptFileData = null;

// ── DOM references ──────────────────────────────────────────────────────────
const encryptUpload      = document.getElementById('encryptUpload');
const encryptFileInput   = document.getElementById('encryptFile');
const encryptFileDisplay = document.getElementById('encryptFileDisplay');
const encryptFileName    = document.getElementById('encryptFileName');
const encryptFileSize    = document.getElementById('encryptFileSize');
const encryptPassword    = document.getElementById('encryptPassword');
const encryptBtn         = document.getElementById('encryptBtn');

const decryptUpload      = document.getElementById('decryptUpload');
const decryptFileInput   = document.getElementById('decryptFile');
const decryptFileDisplay = document.getElementById('decryptFileDisplay');
const decryptFileName    = document.getElementById('decryptFileName');
const decryptFileSize    = document.getElementById('decryptFileSize');
const decryptPassword    = document.getElementById('decryptPassword');
const decryptBtn         = document.getElementById('decryptBtn');

const statusContainer    = document.getElementById('statusContainer');
const progressBar        = document.getElementById('progressBar');
const progressFill       = document.getElementById('progressFill');

// ── Encrypt upload listeners ─────────────────────────────────────────────────
encryptUpload.addEventListener('click', () => encryptFileInput.click());

encryptUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    encryptUpload.classList.add('dragover');
});

encryptUpload.addEventListener('dragleave', () => {
    encryptUpload.classList.remove('dragover');
});

encryptUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    encryptUpload.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleEncryptFile(e.dataTransfer.files[0]);
    }
});

encryptFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleEncryptFile(e.target.files[0]);
    }
});

// ── Decrypt upload listeners ─────────────────────────────────────────────────
decryptUpload.addEventListener('click', () => decryptFileInput.click());

decryptUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    decryptUpload.classList.add('dragover');
});

decryptUpload.addEventListener('dragleave', () => {
    decryptUpload.classList.remove('dragover');
});

decryptUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    decryptUpload.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleDecryptFile(e.dataTransfer.files[0]);
    }
});

decryptFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleDecryptFile(e.target.files[0]);
    }
});

// ── File handler functions ───────────────────────────────────────────────────
function handleEncryptFile(file) {
    if (file.type !== 'application/pdf') {
        showStatus('error', '🚫 Please select a valid PDF file');
        return;
    }

    encryptFileData = file;
    encryptFileName.textContent = file.name;
    encryptFileSize.textContent = formatFileSize(file.size);
    encryptFileDisplay.classList.add('active');
    encryptBtn.disabled = false;

    showStatus('success', `✓ ${file.name} is ready to protect`);
}

function handleDecryptFile(file) {
    if (file.type !== 'application/pdf') {
        showStatus('error', '🚫 Please select a valid PDF file');
        return;
    }

    decryptFileData = file;
    decryptFileName.textContent = file.name;
    decryptFileSize.textContent = formatFileSize(file.size);
    decryptFileDisplay.classList.add('active');
    decryptBtn.disabled = false;

    showStatus('success', `✓ ${file.name} is ready to unlock`);
}

// ── Encrypt button ───────────────────────────────────────────────────────────
encryptBtn.addEventListener('click', async () => {
    const password = encryptPassword.value;

    if (!password) {
        showStatus('error', '🔑 Please enter a password to protect your PDF');
        return;
    }

    if (password.length < 6) {
        showStatus('error', '🔑 Password must be at least 6 characters long');
        return;
    }

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
        const fileName = encryptFileData.name.replace('.pdf', '_protected.pdf');

        downloadFile(blob, fileName);
        updateProgress(100);

        setTimeout(() => {
            showStatus('success', `🎉 Your PDF is now protected!`, fileName);
            progressBar.classList.remove('active');
            updateProgress(0);
        }, 500);

    } catch (error) {
        showStatus('error', `❌ Protection failed: ${error.message}`);
        progressBar.classList.remove('active');
        updateProgress(0);
    }
});

// ── Decrypt button ───────────────────────────────────────────────────────────
decryptBtn.addEventListener('click', async () => {
    const password = decryptPassword.value;

    if (!password) {
        showStatus('error', '🔑 Please enter the password to unlock your PDF');
        return;
    }

    try {
        showStatus('processing', '🔓 Unlocking your PDF...');
        progressBar.classList.add('active');
        updateProgress(30);

        const encryptedText = await decryptFileData.text();
        updateProgress(50);

        const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
        const base64 = decrypted.toString(CryptoJS.enc.Utf8);

        if (!base64) {
            throw new Error('Invalid password or corrupted file');
        }
        updateProgress(70);

        const arrayBuffer = base64ToArrayBuffer(base64);
        updateProgress(90);

        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const fileName = decryptFileData.name.replace('_protected', '_unlocked');

        downloadFile(blob, fileName);
        updateProgress(100);

        setTimeout(() => {
            showStatus('success', `🎉 Your PDF is unlocked!`, fileName);
            progressBar.classList.remove('active');
            updateProgress(0);
        }, 500);

    } catch (error) {
        showStatus('error', `❌ Unlock failed: Wrong password or corrupted file`);
        progressBar.classList.remove('active');
        updateProgress(0);
    }
});

// ── Utility functions ────────────────────────────────────────────────────────
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
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
        const downloadNote = document.createElement('div');
        downloadNote.className = 'status-text';
        downloadNote.style.marginTop = '10px';
        downloadNote.style.fontSize = '0.95rem';
        downloadNote.textContent = `Downloaded as: ${filename}`;
        statusContainer.appendChild(downloadNote);
    }

    // Re-append progress bar (innerHTML wipes it)
    statusContainer.appendChild(progressBar);

    if (type !== 'processing') {
        progressBar.classList.remove('active');
    }
}

function updateProgress(percent) {
    progressFill.style.width = percent + '%';
}