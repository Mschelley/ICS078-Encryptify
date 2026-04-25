// ═══════════════════════════════════════
// ROLES
// ═══════════════════════════════════════
const ROLES = {
    user:    { label: 'User',    icon: '👤', badge: 'Pro',     color: '#5a7355' },
    manager: { label: 'Manager', icon: '👔', badge: 'Manager', color: '#2e6d9e' },
    admin:   { label: 'Admin',   icon: '🛡', badge: 'Admin',   color: '#7b2d8a' }
};
const ROLE_PAGES = {
    user:    ['dashboard','files','activity','settings'],
    manager: ['dashboard','files','activity','team','settings'],
    admin:   ['dashboard','files','activity','team','admin','settings']
};

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
const appState = {
    fileHistory: [],
    activityLog: [],
    settings: { minPassLength:6, autoClear:true, showStrength:true, theme:'natural', reduceMotion:false, saveHistory:true },
    currentUser: null
};

// ═══════════════════════════════════════
// API HELPER
// APP_BASE_URL is injected by app/index.php as a <script> block.
// All fetch calls go to:  /encryptify/api/index.php
// ═══════════════════════════════════════
const API_URL = (typeof APP_BASE_URL !== 'undefined' ? APP_BASE_URL : '') + '/api/router.php';

async function api(params) {
    const body = new URLSearchParams(params);
    const res  = await fetch(API_URL, { method: 'POST', body });
    return res.json();
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function switchPage(page) {
    const user = appState.currentUser;
    if (user) {
        const allowed = ROLE_PAGES[user.role] || ROLE_PAGES.user;
        if (!allowed.includes(page)) { showSettingsToast('🚫 Access denied: insufficient permissions.'); return; }
    }
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active-page');
    const link = document.querySelector('.nav-links a[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    if (page === 'files')    renderFilesPage();
    if (page === 'activity') renderActivityPage();
    if (page === 'settings') loadSettingsPage();
    if (page === 'team')     renderTeamPage();
    if (page === 'admin')    renderAdminPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchPage(link.dataset.page); });
});
document.getElementById('navBrandLink').addEventListener('click', e => { e.preventDefault(); switchPage('dashboard'); });

// ═══════════════════════════════════════
// ROLE UI
// ═══════════════════════════════════════
function applyRoleUI(role) {
    const r = ROLES[role] || ROLES.user;
    const badge = document.getElementById('navRoleBadge');
    badge.textContent = r.badge;
    badge.style.background  = r.color + '22';
    badge.style.color       = r.color;
    badge.style.borderColor = r.color + '44';
    const drRole = document.getElementById('dropdownRole');
    drRole.textContent = r.icon + ' ' + r.label;
    drRole.className   = 'avatar-dropdown-role role-pill-' + role;
    document.querySelectorAll('.nav-item-manager').forEach(el => { el.style.display = (role==='manager'||role==='admin') ? '' : 'none'; });
    document.querySelectorAll('.nav-item-admin').forEach(el => { el.style.display = role==='admin' ? '' : 'none'; });
}

// ═══════════════════════════════════════
// AUTH — demo fill
// ═══════════════════════════════════════
window.fillDemo = function(email, pass) {
    document.getElementById('loginEmail').value    = email;
    document.getElementById('loginPassword').value = pass;
};

const loginScreen   = document.getElementById('loginScreen');
const registerModal = document.getElementById('registerModal');
const loginError    = document.getElementById('loginError');

document.getElementById('openRegisterBtn').addEventListener('click', e => { e.preventDefault(); registerModal.classList.add('visible'); clearRegisterForm(); });
document.getElementById('closeRegisterBtn').addEventListener('click', () => registerModal.classList.remove('visible'));
document.getElementById('backToLoginBtn').addEventListener('click',  e => { e.preventDefault(); registerModal.classList.remove('visible'); });
registerModal.addEventListener('click', e => { if (e.target === registerModal) registerModal.classList.remove('visible'); });

// ═══════════════════════════════════════
// AUTH — REGISTER
// ═══════════════════════════════════════
document.getElementById('registerBtn').addEventListener('click', async () => {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirmPassword').value;
    const agreed    = document.getElementById('agreeTerms').checked;

    document.getElementById('registerError').style.display   = 'none';
    document.getElementById('registerSuccess').style.display = 'none';

    if (!firstName || !lastName)        return showReg('Please enter your first and last name.');
    if (!email || !email.includes('@')) return showReg('Please enter a valid email address.');
    if (password.length < 6)            return showReg('Password must be at least 6 characters.');
    if (password !== confirm)            return showReg('Passwords do not match.');
    if (!agreed)                         return showReg('Please agree to the Terms of Service.');

    const data = await api({ action:'register', firstName, lastName, email, password, confirm });
    if (data.error) return showReg(data.error);

    const s = document.getElementById('registerSuccess');
    s.textContent   = '🎉 Account created! Welcome, ' + data.name + '! Signing you in...';
    s.style.display = 'block';

    setTimeout(async () => {
        registerModal.classList.remove('visible');
        const loginData = await api({ action:'login', email, password });
        if (loginData.success) loginWithUser(loginData.user, loginData.settings);
    }, 1800);
});

function showReg(msg) { const el=document.getElementById('registerError'); el.textContent=msg; el.style.display='block'; }
function clearRegisterForm() {
    ['regFirstName','regLastName','regEmail','regPassword','regConfirmPassword'].forEach(id => document.getElementById(id).value='');
    document.getElementById('agreeTerms').checked=false;
    document.getElementById('registerError').style.display='none';
    document.getElementById('registerSuccess').style.display='none';
}

// ═══════════════════════════════════════
// AUTH — LOGIN
// ═══════════════════════════════════════
async function attemptLogin() {
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const data     = await api({ action:'login', email, password });

    if (data.error) {
        loginError.textContent   = data.error;
        loginError.style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
        return;
    }
    loginError.style.display = 'none';
    loginWithUser(data.user, data.settings);
}

function loginWithUser(user, settings) {
    appState.currentUser = user;

    if (settings) {
        appState.settings.minPassLength = settings.minPassLength ?? 6;
        appState.settings.autoClear     = settings.autoClear     ?? true;
        appState.settings.showStrength  = settings.showStrength  ?? true;
        appState.settings.theme         = settings.theme         ?? 'natural';
        appState.settings.reduceMotion  = settings.reduceMotion  ?? false;
        appState.settings.saveHistory   = settings.saveHistory   ?? true;
        applyTheme(appState.settings.theme);
        if (appState.settings.reduceMotion) document.body.style.setProperty('--anim-speed', '0.01s');
    }

    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase();
    document.getElementById('avatarInitials').textContent  = initials;
    document.getElementById('dropdownName').textContent    = user.name;
    document.getElementById('dropdownEmail').textContent   = user.email;
    document.getElementById('settingName').value  = user.name;
    document.getElementById('settingEmail').value = user.email;
    applyRoleUI(user.role);

    loadFileHistory();

    loginScreen.classList.add('hidden');
    switchPage('dashboard');
}

document.getElementById('loginBtn').addEventListener('click', attemptLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if(e.key==='Enter') attemptLogin(); });
document.getElementById('loginEmail').addEventListener('keydown',    e => { if(e.key==='Enter') document.getElementById('loginPassword').focus(); });

// ═══════════════════════════════════════
// AUTH — LOGOUT
// ═══════════════════════════════════════
document.getElementById('logoutBtn').addEventListener('click', async e => {
    e.preventDefault();
    await api({ action:'logout' });
    appState.currentUser = null;
    appState.fileHistory = [];
    appState.activityLog = [];
    loginScreen.classList.remove('hidden');
    document.getElementById('loginEmail').value    = '';
    document.getElementById('loginPassword').value = '';
    switchPage('dashboard');
});

// ═══════════════════════════════════════
// SESSION CHECK on page load
// ═══════════════════════════════════════
(async () => {
    const data = await api({ action:'session' });
    if (data.loggedIn && data.user) {
        loginWithUser(data.user, data.settings);
    }
})();

// ═══════════════════════════════════════
// FILE HISTORY — load from DB
// ═══════════════════════════════════════
async function loadFileHistory() {
    const data = await api({ action:'get_file_logs' });
    if (!data.logs) return;
    appState.fileHistory = data.logs.map(row => ({
        id:   row.created_at,
        name: row.file_name,
        size: row.file_size,
        type: row.action,
        date: new Date(row.created_at).toLocaleString(),
        user: appState.currentUser ? appState.currentUser.name : 'Unknown',
    }));
}

// ═══════════════════════════════════════
// DASHBOARD — encrypt / decrypt (client-side, unchanged)
// ═══════════════════════════════════════
let encryptFileData=null, decryptFileData=null;

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
const statusContainer    = document.getElementById('statusContainer');
const progressBar        = document.getElementById('progressBar');
const progressFill       = document.getElementById('progressFill');

encryptUpload.addEventListener('click',    () => encryptFileInput.click());
encryptUpload.addEventListener('dragover', e  => { e.preventDefault(); encryptUpload.classList.add('dragover'); });
encryptUpload.addEventListener('dragleave',()  => encryptUpload.classList.remove('dragover'));
encryptUpload.addEventListener('drop',     e  => { e.preventDefault(); encryptUpload.classList.remove('dragover'); if(e.dataTransfer.files.length>0) handleEncryptFile(e.dataTransfer.files[0]); });
encryptFileInput.addEventListener('change',e  => { if(e.target.files.length>0) handleEncryptFile(e.target.files[0]); });

decryptUpload.addEventListener('click',    () => decryptFileInput.click());
decryptUpload.addEventListener('dragover', e  => { e.preventDefault(); decryptUpload.classList.add('dragover'); });
decryptUpload.addEventListener('dragleave',()  => decryptUpload.classList.remove('dragover'));
decryptUpload.addEventListener('drop',     e  => { e.preventDefault(); decryptUpload.classList.remove('dragover'); if(e.dataTransfer.files.length>0) handleDecryptFile(e.dataTransfer.files[0]); });
decryptFileInput.addEventListener('change',e  => { if(e.target.files.length>0) handleDecryptFile(e.target.files[0]); });

encryptPasswordEl.addEventListener('input', () => {
    if (!appState.settings.showStrength) { encryptStrength.textContent=''; return; }
    const val = encryptPasswordEl.value;
    if (!val) { encryptStrength.textContent=''; return; }
    let score=0;
    if(val.length>=8) score++; if(val.length>=12) score++;
    if(/[A-Z]/.test(val)) score++; if(/[0-9]/.test(val)) score++; if(/[^A-Za-z0-9]/.test(val)) score++;
    const levels=[{cls:'strength-weak',label:'⚠ Weak'},{cls:'strength-weak',label:'⚠ Weak'},{cls:'strength-fair',label:'◑ Fair'},{cls:'strength-good',label:'✓ Good'},{cls:'strength-strong',label:'✦ Strong'},{cls:'strength-strong',label:'✦ Strong'}];
    const lvl=levels[score]||levels[0];
    encryptStrength.className='password-strength '+lvl.cls; encryptStrength.textContent=lvl.label;
});

function handleEncryptFile(file) {
    if(file.type!=='application/pdf'){ showStatus('error','🚫 Please select a valid PDF file'); return; }
    encryptFileData=file; encryptFileName.textContent=file.name; encryptFileSize.textContent=formatFileSize(file.size);
    encryptFileDisplay.classList.add('active'); encryptBtn.disabled=false;
    showStatus('success','✓ '+file.name+' is ready to protect');
}
function handleDecryptFile(file) {
    if(file.type!=='application/pdf'){ showStatus('error','🚫 Please select a valid PDF file'); return; }
    decryptFileData=file; decryptFileName.textContent=file.name; decryptFileSize.textContent=formatFileSize(file.size);
    decryptFileDisplay.classList.add('active'); decryptBtn.disabled=false;
    showStatus('success','✓ '+file.name+' is ready to unlock');
}

encryptBtn.addEventListener('click', async () => {
    const password=encryptPasswordEl.value, minLen=appState.settings.minPassLength;
    if(!password){ showStatus('error','🔑 Please enter a password'); return; }
    if(password.length<minLen){ showStatus('error','🔑 Password must be at least '+minLen+' characters'); return; }
    try {
        showStatus('processing','🌿 Protecting your PDF...'); progressBar.classList.add('active'); updateProgress(30);
        const ab=await encryptFileData.arrayBuffer(); updateProgress(50);
        const b64=arrayBufferToBase64(ab); updateProgress(70);
        const enc=CryptoJS.AES.encrypt(b64,password).toString(); updateProgress(90);
        const blob=new Blob([enc],{type:'application/octet-stream'});
        const out=encryptFileData.name.replace('.pdf','_protected.pdf');
        downloadFile(blob,out); updateProgress(100);
        await addFileToHistory({name:out, size:blob.size, type:'encrypted', originalName:encryptFileData.name});
        addActivityLog('🔒 Encrypted',out);
        if(appState.settings.autoClear) encryptPasswordEl.value=''; encryptStrength.textContent='';
        setTimeout(()=>{ showStatus('success','🎉 Your PDF is now protected!',out); progressBar.classList.remove('active'); updateProgress(0); },500);
    } catch(e){ showStatus('error','❌ Protection failed: '+e.message); progressBar.classList.remove('active'); updateProgress(0); }
});

decryptBtn.addEventListener('click', async () => {
    const password=decryptPasswordEl.value;
    if(!password){ showStatus('error','🔑 Please enter the password'); return; }
    try {
        showStatus('processing','🔓 Unlocking your PDF...'); progressBar.classList.add('active'); updateProgress(30);
        const et=await decryptFileData.text(); updateProgress(50);
        const dec=CryptoJS.AES.decrypt(et,password);
        const b64=dec.toString(CryptoJS.enc.Utf8);
        if(!b64) throw new Error('Invalid password or corrupted file');
        updateProgress(70);
        const ab=base64ToArrayBuffer(b64); updateProgress(90);
        const blob=new Blob([ab],{type:'application/pdf'});
        const out=decryptFileData.name.replace('_protected','_unlocked');
        downloadFile(blob,out); updateProgress(100);
        await addFileToHistory({name:out, size:blob.size, type:'decrypted', originalName:decryptFileData.name});
        addActivityLog('🔓 Decrypted',out);
        if(appState.settings.autoClear) decryptPasswordEl.value='';
        setTimeout(()=>{ showStatus('success','🎉 Your PDF is unlocked!',out); progressBar.classList.remove('active'); updateProgress(0); },500);
    } catch(e){ showStatus('error','❌ Unlock failed: Wrong password or corrupted file'); progressBar.classList.remove('active'); updateProgress(0); }
});

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
async function addFileToHistory({name, size, type, originalName}) {
    if (!appState.settings.saveHistory) return;
    const entry = { id:Date.now(), name, size, type, originalName, date:new Date().toLocaleString(), user:appState.currentUser?appState.currentUser.name:'Unknown' };
    appState.fileHistory.unshift(entry);
    if (appState.currentUser) {
        await api({ action:'log_file', type, fileName:name, fileSize:size });
    }
}
function addActivityLog(action, filename) {
    appState.activityLog.unshift({ action, filename, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), fullDate:new Date(), user:appState.currentUser?appState.currentUser.name:'Unknown' });
}
function arrayBufferToBase64(buffer) { let b=''; const bytes=new Uint8Array(buffer); for(let i=0;i<bytes.byteLength;i++) b+=String.fromCharCode(bytes[i]); return btoa(b); }
function base64ToArrayBuffer(base64) { const bs=atob(base64); const bytes=new Uint8Array(bs.length); for(let i=0;i<bs.length;i++) bytes[i]=bs.charCodeAt(i); return bytes.buffer; }
function formatFileSize(bytes) { if(bytes===0) return '0 Bytes'; const k=1024,s=['Bytes','KB','MB','GB'],i=Math.floor(Math.log(bytes)/Math.log(k)); return Math.round(bytes/Math.pow(k,i)*100)/100+' '+s[i]; }
function downloadFile(blob,filename) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
function showStatus(type,message,filename=null) {
    const icons={success:'✨',error:'🚫',processing:'⏳'};
    statusContainer.className='status-container '+type;
    statusContainer.innerHTML='<div class="status-icon">'+icons[type]+'</div><div class="status-text">'+message+'</div>';
    if(type==='success'&&filename){ const n=document.createElement('div'); n.className='status-text'; n.style.cssText='margin-top:10px;font-size:0.95rem;'; n.textContent='Downloaded as: '+filename; statusContainer.appendChild(n); }
    statusContainer.appendChild(progressBar);
    if(type!=='processing') progressBar.classList.remove('active');
}
function updateProgress(p) { progressFill.style.width=p+'%'; }

// ═══════════════════════════════════════
// FILES PAGE
// ═══════════════════════════════════════
let activeFilter='all', searchQuery='';
function renderFilesPage() {
    const grid=document.getElementById('filesGrid'), empty=document.getElementById('filesEmpty');
    let files=appState.fileHistory;
    if(activeFilter!=='all') files=files.filter(f=>f.type===activeFilter);
    if(searchQuery.trim()) files=files.filter(f=>f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    grid.innerHTML='';
    if(files.length===0){ grid.style.display='none'; empty.classList.add('visible'); return; }
    grid.style.display='grid'; empty.classList.remove('visible');
    files.forEach((file,i)=>{
        const card=document.createElement('div'); card.className='file-card type-'+file.type; card.style.animationDelay=i*0.06+'s';
        card.innerHTML='<div class="file-card-icon">'+(file.type==='encrypted'?'🔒':'🔓')+'</div><div class="file-card-name">'+file.name+'</div><div class="file-card-meta"><span>'+formatFileSize(file.size)+'</span><span>'+file.date+'</span></div><span class="file-card-badge badge-'+file.type+'">'+(file.type==='encrypted'?'🔒 Encrypted':'🔓 Decrypted')+'</span>';
        grid.appendChild(card);
    });
}
document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{ document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); activeFilter=btn.dataset.filter; renderFilesPage(); });
});
document.getElementById('filesSearch').addEventListener('input',e=>{ searchQuery=e.target.value; renderFilesPage(); });

// ═══════════════════════════════════════
// ACTIVITY PAGE
// ═══════════════════════════════════════
function renderActivityPage() {
    const enc=appState.fileHistory.filter(f=>f.type==='encrypted').length;
    const dec=appState.fileHistory.filter(f=>f.type==='decrypted').length;
    const total=appState.fileHistory.length;
    const today=appState.fileHistory.filter(f=>{ try { return new Date(f.date).toDateString()===new Date().toDateString(); } catch(e){ return false; }}).length;
    document.getElementById('statEncrypted').textContent=enc;
    document.getElementById('statDecrypted').textContent=dec;
    document.getElementById('statTotal').textContent=total;
    document.getElementById('statToday').textContent=today;
    const log=document.getElementById('activityLog');
    if(appState.activityLog.length===0){ log.innerHTML='<div class="activity-empty">No activity yet. Start encrypting or decrypting files!</div>'; return; }
    log.innerHTML=appState.activityLog.map(item=>'<div class="activity-item"><div class="activity-dot '+(item.action.includes('🔒')?'dot-encrypt':'dot-decrypt')+'">'+item.action.split(' ')[0]+'</div><div class="activity-info"><div class="activity-action">'+item.action+'</div><div class="activity-filename">'+item.filename+'</div></div><div class="activity-time">'+item.time+'</div></div>').join('');
}
document.getElementById('clearLogBtn').addEventListener('click',()=>{ appState.activityLog=[]; renderActivityPage(); });

// ═══════════════════════════════════════
// TEAM PAGE
// ═══════════════════════════════════════
async function renderTeamPage() {
    const user=appState.currentUser;
    if(!user||(user.role!=='manager'&&user.role!=='admin')) return;
    document.getElementById('teamSubtitle').textContent = user.role==='admin' ? 'Admin view — all users' : 'Manager view — your team';

    const data = await api({ action:'get_users' });
    if (!data.users) return;
    const users = data.users;

    document.getElementById('teamStatMembers').textContent   = users.length;
    document.getElementById('teamStatEncrypted').textContent = appState.fileHistory.filter(f=>f.type==='encrypted').length;
    document.getElementById('teamStatDecrypted').textContent = appState.fileHistory.filter(f=>f.type==='decrypted').length;
    document.getElementById('teamStatActive').textContent    = users.filter(u=>u.status==='active').length;

    document.getElementById('teamMembersList').innerHTML = users.map(u=>{
        const r=ROLES[u.role]||ROLES.user;
        const initials=(u.first_name[0]+(u.last_name[0]||'')).toUpperCase();
        const fullName=u.first_name+' '+u.last_name;
        const isSelf=u.email===appState.currentUser.email;
        const joined=new Date(u.created_at).toLocaleDateString();
        return '<div class="team-member-row"><div class="team-member-avatar" style="background:'+r.color+'22"><span style="color:'+r.color+';font-weight:700;font-size:0.85rem">'+initials+'</span></div><div class="team-member-info"><div class="team-member-name">'+fullName+(isSelf?' <span class="team-you-tag">you</span>':'')+'</div><div class="team-member-email">'+u.email+'</div></div><span class="team-role-pill role-pill-'+u.role+'">'+r.icon+' '+r.label+'</span><span class="team-status-pill status-'+u.status+'">'+(u.status==='active'?'● Active':'○ Suspended')+'</span><div class="team-member-joined">Joined '+joined+'</div></div>';
    }).join('');

    const teamLog=document.getElementById('teamActivityLog');
    if(appState.activityLog.length===0){ teamLog.innerHTML='<div class="activity-empty">No team activity yet.</div>'; return; }
    teamLog.innerHTML=appState.activityLog.slice(0,20).map(item=>'<div class="activity-item"><div class="activity-dot '+(item.action.includes('🔒')?'dot-encrypt':'dot-decrypt')+'">'+item.action.split(' ')[0]+'</div><div class="activity-info"><div class="activity-action">'+item.action+' <span style="color:var(--sage);font-size:0.8rem">by '+item.user+'</span></div><div class="activity-filename">'+item.filename+'</div></div><div class="activity-time">'+item.time+'</div></div>').join('');
}

// ═══════════════════════════════════════
// ADMIN PAGE
// ═══════════════════════════════════════
async function renderAdminPage() {
    const user=appState.currentUser;
    if(!user||user.role!=='admin') return;

    const [usersData, logsData] = await Promise.all([
        api({ action:'get_users' }),
        api({ action:'get_system_logs' }),
    ]);

    const users    = usersData.users || [];
    const totalOps = users.reduce((s,u) => s+(u.ops||0), 0);

    document.getElementById('adminStatUsers').textContent    = users.length;
    document.getElementById('adminStatAdmins').textContent   = users.filter(u=>u.role==='admin').length;
    document.getElementById('adminStatManagers').textContent = users.filter(u=>u.role==='manager').length;
    document.getElementById('adminStatOps').textContent      = totalOps;

    const tbody=document.getElementById('adminUserTableBody');
    tbody.innerHTML=users.map(u=>{
        const r=ROLES[u.role]||ROLES.user;
        const initials=(u.first_name[0]+(u.last_name[0]||'')).toUpperCase();
        const fullName=u.first_name+' '+u.last_name;
        const isSelf=u.email===appState.currentUser.email;
        return '<tr class="'+(u.status==='suspended'?'row-suspended':'')+'"><td><div class="admin-user-cell"><div class="admin-user-avatar" style="background:'+r.color+'22;color:'+r.color+'">'+initials+'</div><span>'+fullName+(isSelf?' <span class="team-you-tag">you</span>':'')+'</span></div></td><td class="admin-email-cell">'+u.email+'</td><td><select class="admin-role-select" data-uid="'+u.id+'"'+(isSelf?' disabled':'')+'><option value="user"'+(u.role==='user'?' selected':'')+'>👤 User</option><option value="manager"'+(u.role==='manager'?' selected':'')+'>👔 Manager</option><option value="admin"'+(u.role==='admin'?' selected':'')+'>🛡 Admin</option></select></td><td><span class="team-status-pill status-'+u.status+'">'+(u.status==='active'?'● Active':'○ Suspended')+'</span></td><td><div class="admin-actions">'+(isSelf?'<span style="opacity:0.35;font-size:0.8rem">—</span>':'<button class="admin-btn admin-btn-toggle" data-uid="'+u.id+'" data-name="'+fullName+'" title="'+(u.status==='active'?'Suspend':'Activate')+'">'+(u.status==='active'?'🚫':'✅')+'</button><button class="admin-btn admin-btn-delete" data-uid="'+u.id+'" data-name="'+fullName+'" title="Delete">🗑</button>')+'</div></td></tr>';
    }).join('');

    tbody.querySelectorAll('.admin-role-select').forEach(sel=>{
        sel.addEventListener('change', async e=>{
            const uid=e.target.dataset.uid, newRole=e.target.value;
            const res=await api({ action:'change_role', userId:uid, role:newRole });
            if(res.error){ showSettingsToast('❌ '+res.error); return; }
            showSettingsToast('✓ Role updated to '+newRole);
            renderAdminPage();
        });
    });
    tbody.querySelectorAll('.admin-btn-toggle').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
            const uid=btn.dataset.uid, name=btn.dataset.name;
            const res=await api({ action:'toggle_status', userId:uid });
            if(res.error){ showSettingsToast('❌ '+res.error); return; }
            showSettingsToast((res.newStatus==='suspended'?'🚫 Suspended':'✅ Reactivated')+': '+name);
            renderAdminPage();
        });
    });
    tbody.querySelectorAll('.admin-btn-delete').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
            const uid=btn.dataset.uid, name=btn.dataset.name;
            if(!confirm('Delete user "'+name+'"? This cannot be undone.')) return;
            const res=await api({ action:'delete_user', userId:uid });
            if(res.error){ showSettingsToast('❌ '+res.error); return; }
            showSettingsToast('🗑 Deleted: '+name);
            renderAdminPage();
        });
    });

    const sysLog=document.getElementById('systemLog');
    const logs=logsData.logs||[];
    if(logs.length===0){ sysLog.innerHTML='<div class="activity-empty">No system events recorded.</div>'; return; }
    sysLog.innerHTML=logs.map(item=>{
        const t=new Date(item.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        return '<div class="activity-item"><div class="activity-dot" style="background:rgba(123,45,138,0.1)">🖥</div><div class="activity-info"><div class="activity-action" style="color:var(--deep-green)">'+item.message+'</div></div><div class="activity-time">'+t+'</div></div>';
    }).join('');
}

document.getElementById('clearSystemLogBtn').addEventListener('click', async ()=>{
    await api({ action:'clear_system_logs' });
    renderAdminPage();
});

// ═══════════════════════════════════════
// ADD USER MODAL
// ═══════════════════════════════════════
const addUserModal=document.getElementById('addUserModal');
document.getElementById('addUserBtn').addEventListener('click',()=>{
    addUserModal.classList.add('visible');
    ['addUserFirstName','addUserLastName','addUserEmail','addUserPassword'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('addUserRole').value='user';
    document.getElementById('addUserError').style.display='none';
});
document.getElementById('closeAddUserBtn').addEventListener('click',()=>addUserModal.classList.remove('visible'));
addUserModal.addEventListener('click',e=>{ if(e.target===addUserModal) addUserModal.classList.remove('visible'); });
document.getElementById('confirmAddUserBtn').addEventListener('click', async ()=>{
    const fn=document.getElementById('addUserFirstName').value.trim();
    const ln=document.getElementById('addUserLastName').value.trim();
    const em=document.getElementById('addUserEmail').value.trim();
    const pw=document.getElementById('addUserPassword').value;
    const rl=document.getElementById('addUserRole').value;
    const errEl=document.getElementById('addUserError');
    errEl.style.display='none';
    const res=await api({ action:'add_user', firstName:fn, lastName:ln, email:em, password:pw, role:rl });
    if(res.error){ errEl.textContent=res.error; errEl.style.display='block'; return; }
    showSettingsToast('✓ User "'+fn+' '+ln+'" created as '+rl);
    addUserModal.classList.remove('visible');
    renderAdminPage();
});

// ═══════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════
function loadSettingsPage() {
    const user=appState.currentUser;
    if(user){
        document.getElementById('settingName').value=user.name;
        document.getElementById('settingEmail').value=user.email;
        const r=ROLES[user.role]||ROLES.user;
        const badge=document.getElementById('settingsRoleBadge');
        badge.textContent=r.icon+' '+r.label; badge.className='settings-role-badge role-pill-'+user.role;
    }
    document.getElementById('settingMinPass').value        = appState.settings.minPassLength;
    document.getElementById('settingAutoClear').checked    = appState.settings.autoClear;
    document.getElementById('settingPassStrength').checked = appState.settings.showStrength;
    document.getElementById('settingTheme').value          = appState.settings.theme;
    document.getElementById('settingReduceMotion').checked = appState.settings.reduceMotion;
    document.getElementById('settingHistory').checked      = appState.settings.saveHistory;
}

async function saveSettingsToDB() {
    const body = {
        action:        'save_settings',
        name:          document.getElementById('settingName').value.trim(),
        email:         document.getElementById('settingEmail').value.trim(),
        minPassLength: document.getElementById('settingMinPass').value,
        theme:         document.getElementById('settingTheme').value,
    };
    if(document.getElementById('settingAutoClear').checked)    body.autoClear    = '1';
    if(document.getElementById('settingPassStrength').checked) body.showStrength = '1';
    if(document.getElementById('settingReduceMotion').checked) body.reduceMotion = '1';
    if(document.getElementById('settingHistory').checked)      body.saveHistory  = '1';
    await api(body);
}

document.getElementById('saveAccountBtn').addEventListener('click', async ()=>{
    const name=document.getElementById('settingName').value.trim(), email=document.getElementById('settingEmail').value.trim();
    if(!name) return showSettingsToast('⚠ Please enter a display name.');
    if(!email) return showSettingsToast('⚠ Please enter an email address.');
    if(appState.currentUser){
        appState.currentUser.name=name; appState.currentUser.email=email;
        const initials=name.split(' ').map(w=>w[0]).join('').toUpperCase();
        document.getElementById('avatarInitials').textContent=initials;
        document.getElementById('dropdownName').textContent=name;
        document.getElementById('dropdownEmail').textContent=email;
    }
    await saveSettingsToDB();
    showSettingsToast('✓ Account details saved!');
});
document.getElementById('settingMinPass').addEventListener('change',async e=>{ appState.settings.minPassLength=parseInt(e.target.value); await saveSettingsToDB(); showSettingsToast('✓ Security settings updated.'); });
document.getElementById('settingAutoClear').addEventListener('change',e=>{ appState.settings.autoClear=e.target.checked; saveSettingsToDB(); });
document.getElementById('settingPassStrength').addEventListener('change',e=>{ appState.settings.showStrength=e.target.checked; if(!e.target.checked) encryptStrength.textContent=''; saveSettingsToDB(); });
document.getElementById('settingTheme').addEventListener('change',async e=>{ appState.settings.theme=e.target.value; applyTheme(e.target.value); await saveSettingsToDB(); showSettingsToast('✓ Theme applied!'); });
document.getElementById('settingReduceMotion').addEventListener('change',async e=>{ appState.settings.reduceMotion=e.target.checked; document.body.style.setProperty('--anim-speed',e.target.checked?'0.01s':''); await saveSettingsToDB(); showSettingsToast(e.target.checked?'✓ Animations reduced.':'✓ Animations restored.'); });
document.getElementById('settingHistory').addEventListener('change',e=>{ appState.settings.saveHistory=e.target.checked; saveSettingsToDB(); });
document.getElementById('clearAllDataBtn').addEventListener('click',()=>{ if(confirm('Clear all file history and activity logs?')){ appState.fileHistory=[]; appState.activityLog=[]; showSettingsToast('🗑 All data cleared.'); } });

function applyTheme(theme) {
    const root=document.documentElement;
    if(theme==='ocean'){ root.style.setProperty('--sage','#7aaccf'); root.style.setProperty('--forest','#2e6d9e'); root.style.setProperty('--deep-green','#1a3f5c'); root.style.setProperty('--terracotta','#5bc4c4'); root.style.setProperty('--earth','#4a7a8a'); root.style.setProperty('--clay','#88c4d8'); }
    else if(theme==='dusk'){ root.style.setProperty('--sage','#c4a0c8'); root.style.setProperty('--forest','#7b4d8a'); root.style.setProperty('--deep-green','#4a2060'); root.style.setProperty('--terracotta','#e88a7a'); root.style.setProperty('--earth','#8a5568'); root.style.setProperty('--clay','#d4a8b8'); }
    else { root.style.setProperty('--sage','#9caf88'); root.style.setProperty('--forest','#5a7355'); root.style.setProperty('--deep-green','#3d5a3d'); root.style.setProperty('--terracotta','#d4a373'); root.style.setProperty('--earth','#8b7355'); root.style.setProperty('--clay','#c8a882'); }
}
function showSettingsToast(msg) { const t=document.getElementById('settingsToast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }
