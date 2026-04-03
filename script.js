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

const appState = {
    fileHistory: [], activityLog: [], systemLog: [],
    settings: { minPassLength:6, autoClear:true, showStrength:true, theme:'natural', reduceMotion:false, saveHistory:true },
    currentUser: null
};

const userStore = [
    { email:'demo@encryptify.app',    password:'demo1234',   name:'Demo User',      role:'user',    status:'active', joined:'2024-01-15' },
    { email:'manager@encryptify.app', password:'manager123', name:'Maya Rodriguez', role:'manager', status:'active', joined:'2023-11-03' },
    { email:'admin@encryptify.app',   password:'admin123',   name:'Admin System',   role:'admin',   status:'active', joined:'2023-06-01' }
];

// ── NAVIGATION ────────────────────────────────────────────────────────────────

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
    window.scrollTo({ top:0, behavior:'smooth' });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchPage(link.dataset.page); });
});
document.getElementById('navBrandLink').addEventListener('click', e => { e.preventDefault(); switchPage('dashboard'); });

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

// ── AUTH ──────────────────────────────────────────────────────────────────────

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

document.getElementById('registerBtn').addEventListener('click', () => {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const confirm   = document.getElementById('regConfirmPassword').value;
    const agreed    = document.getElementById('agreeTerms').checked;
    document.getElementById('registerError').style.display   = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
    if (!firstName||!lastName)        return showReg('Please enter your first and last name.');
    if (!email||!email.includes('@'))  return showReg('Please enter a valid email address.');
    if (password.length < 6)          return showReg('Password must be at least 6 characters.');
    if (password !== confirm)          return showReg('Passwords do not match.');
    if (!agreed)                       return showReg('Please agree to the Terms of Service.');
    if (userStore.find(u => u.email===email)) return showReg('An account with this email already exists.');
    const newUser = { email, password, name: firstName+' '+lastName, role:'user', status:'active', joined: new Date().toISOString().split('T')[0] };
    userStore.push(newUser);
    addSystemLog('New user registered: ' + newUser.name);
    const s = document.getElementById('registerSuccess');
    s.textContent = '🎉 Account created! Welcome, ' + firstName + '! Signing you in...';
    s.style.display = 'block';
    setTimeout(() => { registerModal.classList.remove('visible'); loginWithUser(newUser); }, 1800);
});

function showReg(msg) { const el=document.getElementById('registerError'); el.textContent=msg; el.style.display='block'; }
function clearRegisterForm() {
    ['regFirstName','regLastName','regEmail','regPassword','regConfirmPassword'].forEach(id => document.getElementById(id).value='');
    document.getElementById('agreeTerms').checked=false;
    document.getElementById('registerError').style.display='none';
    document.getElementById('registerSuccess').style.display='none';
}

function attemptLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    const user  = userStore.find(u => u.email===email && u.password===pass);
    if (user) {
        if (user.status==='suspended') { loginError.textContent='🚫 This account has been suspended. Contact admin.'; loginError.style.display='block'; return; }
        loginError.style.display='none'; loginWithUser(user);
    } else {
        loginError.textContent='Invalid email or password. Please try again.'; loginError.style.display='block';
        document.getElementById('loginPassword').value=''; document.getElementById('loginPassword').focus();
    }
}

function loginWithUser(user) {
    appState.currentUser = user;
    const initials = user.name.split(' ').map(w=>w[0]).join('').toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('dropdownName').textContent   = user.name;
    document.getElementById('dropdownEmail').textContent  = user.email;
    document.getElementById('settingName').value  = user.name;
    document.getElementById('settingEmail').value = user.email;
    applyRoleUI(user.role);
    applyTheme(appState.settings.theme);
    addSystemLog('User logged in: ' + user.name + ' [' + user.role + ']');
    loginScreen.classList.add('hidden');
    switchPage('dashboard');
}

document.getElementById('loginBtn').addEventListener('click', attemptLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if(e.key==='Enter') attemptLogin(); });
document.getElementById('loginEmail').addEventListener('keydown',    e => { if(e.key==='Enter') document.getElementById('loginPassword').focus(); });

document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    if (appState.currentUser) addSystemLog('User logged out: ' + appState.currentUser.name);
    appState.currentUser = null;
    loginScreen.classList.remove('hidden');
    document.getElementById('loginEmail').value=''; document.getElementById('loginPassword').value='';
    switchPage('dashboard');
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

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
        addFileToHistory({name:out,size:blob.size,type:'encrypted',originalName:encryptFileData.name});
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
        addFileToHistory({name:out,size:blob.size,type:'decrypted',originalName:decryptFileData.name});
        addActivityLog('🔓 Decrypted',out);
        if(appState.settings.autoClear) decryptPasswordEl.value='';
        setTimeout(()=>{ showStatus('success','🎉 Your PDF is unlocked!',out); progressBar.classList.remove('active'); updateProgress(0); },500);
    } catch(e){ showStatus('error','❌ Unlock failed: Wrong password or corrupted file'); progressBar.classList.remove('active'); updateProgress(0); }
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function addFileToHistory({name,size,type,originalName}) {
    if(!appState.settings.saveHistory) return;
    appState.fileHistory.unshift({id:Date.now(),name,size,type,originalName,date:new Date().toLocaleString(),dateObj:new Date(),user:appState.currentUser?appState.currentUser.name:'Unknown'});
}
function addActivityLog(action,filename) {
    appState.activityLog.unshift({action,filename,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),fullDate:new Date(),user:appState.currentUser?appState.currentUser.name:'Unknown'});
}
function addSystemLog(msg) {
    appState.systemLog.unshift({msg,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),fullDate:new Date()});
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

// ── FILES PAGE ────────────────────────────────────────────────────────────────

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

// ── CHART ─────────────────────────────────────────────────────────────────────

function drawActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;

    const days  = parseInt(document.getElementById('chartRange').value) || 30;
    const ctx   = canvas.getContext('2d');

    // ── Build per-day buckets ──────────────────────────────────────────
    const labels=[], encData=[], decData=[];
    const now = new Date(); now.setHours(23,59,59,999);

    for (let i = days-1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);          // "YYYY-MM-DD"
        labels.push(i === 0 ? 'Today' : key.slice(5));    // "MM-DD" or "Today"

        const dayFiles = appState.fileHistory.filter(f => {
            const fd = f.dateObj instanceof Date ? f.dateObj : new Date(f.date);
            return fd.toISOString().slice(0,10) === key;
        });
        encData.push(dayFiles.filter(f => f.type==='encrypted').length);
        decData.push(dayFiles.filter(f => f.type==='decrypted').length);
    }

    // ── HiDPI sizing ──────────────────────────────────────────────────
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const W = rect.width, H = rect.height;
    const padL=42, padR=18, padT=18, padB=34;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    ctx.clearRect(0, 0, W, H);

    // ── Y-axis scale ──────────────────────────────────────────────────
    const maxVal  = Math.max(1, ...encData, ...decData);
    const yStep   = Math.ceil(maxVal / 4) || 1;
    const yMax    = yStep * 4;

    // ── Grid lines + Y labels ─────────────────────────────────────────
    ctx.strokeStyle = 'rgba(90,115,85,0.12)';
    ctx.lineWidth   = 1;
    ctx.font        = '10px DM Sans, sans-serif';
    ctx.fillStyle   = 'rgba(90,115,85,0.55)';
    ctx.textAlign   = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padT + cH * (1 - i/4);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL+cW, y); ctx.stroke();
        ctx.fillText(yStep * i, padL - 6, y + 3.5);
    }

    // ── Bars ──────────────────────────────────────────────────────────
    const n      = labels.length;
    const groupW = cW / n;
    const barW   = Math.max(4, Math.min(20, groupW * 0.32));
    const gap    = 3;

    labels.forEach((lbl, i) => {
        const cx = padL + i * groupW + groupW / 2;

        // Encrypted bar (green)
        const eH = (encData[i] / yMax) * cH;
        if (eH > 0) {
            ctx.fillStyle = '#5a7355';
            ctx.beginPath();
            ctx.roundRect(cx - barW - gap/2, padT + cH - eH, barW, eH, [4,4,0,0]);
            ctx.fill();
        }

        // Decrypted bar (terracotta)
        const dH = (decData[i] / yMax) * cH;
        if (dH > 0) {
            ctx.fillStyle = '#d4a373';
            ctx.beginPath();
            ctx.roundRect(cx + gap/2, padT + cH - dH, barW, dH, [4,4,0,0]);
            ctx.fill();
        }

        // Empty-day ghost bars so the chart feels full when no data yet
        if (eH === 0) {
            ctx.fillStyle = 'rgba(90,115,85,0.07)';
            ctx.beginPath();
            ctx.roundRect(cx - barW - gap/2, padT + cH - 4, barW, 4, [2,2,0,0]);
            ctx.fill();
        }
        if (dH === 0) {
            ctx.fillStyle = 'rgba(212,163,115,0.07)';
            ctx.beginPath();
            ctx.roundRect(cx + gap/2, padT + cH - 4, barW, 4, [2,2,0,0]);
            ctx.fill();
        }

        // X labels — thin out if too many days
        const showLabel = n <= 14 || i % Math.ceil(n/14) === 0 || i === n-1;
        if (showLabel) {
            ctx.fillStyle  = 'rgba(90,115,85,0.6)';
            ctx.font       = '10px DM Sans, sans-serif';
            ctx.textAlign  = 'center';
            ctx.fillText(lbl, cx, padT + cH + 20);
        }
    });

    // ── Baseline ─────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(90,115,85,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT + cH);
    ctx.lineTo(padL + cW, padT + cH);
    ctx.stroke();
}

// Re-draw when range selector changes
document.getElementById('chartRange').addEventListener('change', drawActivityChart);

// Re-draw on window resize so HiDPI stays correct
window.addEventListener('resize', () => {
    if (document.getElementById('page-activity').classList.contains('active-page')) {
        drawActivityChart();
    }
});

// ── ACTIVITY PAGE ─────────────────────────────────────────────────────────────

function renderActivityPage() {
    const enc   = appState.fileHistory.filter(f=>f.type==='encrypted').length;
    const dec   = appState.fileHistory.filter(f=>f.type==='decrypted').length;
    const total = appState.fileHistory.length;
    const today = appState.fileHistory.filter(f=>{
        const fd = f.dateObj instanceof Date ? f.dateObj : new Date(f.date);
        return fd.toDateString() === new Date().toDateString();
    }).length;
    document.getElementById('statEncrypted').textContent = enc;
    document.getElementById('statDecrypted').textContent = dec;
    document.getElementById('statTotal').textContent     = total;
    document.getElementById('statToday').textContent     = today;

    // ── Draw chart ────────────────────────────────────────────────────
    drawActivityChart();

    // ── Activity log list ─────────────────────────────────────────────
    const log = document.getElementById('activityLog');
    if (appState.activityLog.length===0) {
        log.innerHTML='<div class="activity-empty">No activity yet. Start encrypting or decrypting files!</div>';
        return;
    }
    log.innerHTML = appState.activityLog.map(item =>
        '<div class="activity-item">' +
        '<div class="activity-dot '+(item.action.includes('🔒')?'dot-encrypt':'dot-decrypt')+'">'+item.action.split(' ')[0]+'</div>' +
        '<div class="activity-info"><div class="activity-action">'+item.action+'</div><div class="activity-filename">'+item.filename+'</div></div>' +
        '<div class="activity-time">'+item.time+'</div>' +
        '</div>'
    ).join('');
}

document.getElementById('clearLogBtn').addEventListener('click', () => {
    appState.activityLog=[];
    appState.fileHistory=[];
    renderActivityPage();
});

// ── TEAM PAGE ─────────────────────────────────────────────────────────────────

function renderTeamPage() {
    const user=appState.currentUser;
    if(!user||(user.role!=='manager'&&user.role!=='admin')) return;
    document.getElementById('teamSubtitle').textContent = user.role==='admin' ? 'Admin view — all users' : 'Manager view — your team';
    document.getElementById('teamStatMembers').textContent   = userStore.length;
    document.getElementById('teamStatEncrypted').textContent = appState.fileHistory.filter(f=>f.type==='encrypted').length;
    document.getElementById('teamStatDecrypted').textContent = appState.fileHistory.filter(f=>f.type==='decrypted').length;
    document.getElementById('teamStatActive').textContent    = userStore.filter(u=>u.status==='active').length;
    const visibleUsers = user.role==='admin' ? userStore : userStore.filter(u=>u.role==='user');
    document.getElementById('teamMembersList').innerHTML = visibleUsers.map(u=>{
        const r=ROLES[u.role]||ROLES.user;
        const initials=u.name.split(' ').map(w=>w[0]).join('').toUpperCase();
        const isSelf=u.email===appState.currentUser.email;
        return '<div class="team-member-row"><div class="team-member-avatar" style="background:'+r.color+'22"><span style="color:'+r.color+';font-weight:700;font-size:0.85rem">'+initials+'</span></div><div class="team-member-info"><div class="team-member-name">'+u.name+(isSelf?' <span class="team-you-tag">you</span>':'')+'</div><div class="team-member-email">'+u.email+'</div></div><span class="team-role-pill role-pill-'+u.role+'">'+r.icon+' '+r.label+'</span><span class="team-status-pill status-'+u.status+'">'+(u.status==='active'?'● Active':'○ Suspended')+'</span><div class="team-member-joined">Joined '+u.joined+'</div></div>';
    }).join('');
    const teamLog=document.getElementById('teamActivityLog');
    if(appState.activityLog.length===0){ teamLog.innerHTML='<div class="activity-empty">No team activity yet.</div>'; return; }
    teamLog.innerHTML=appState.activityLog.slice(0,20).map(item=>'<div class="activity-item"><div class="activity-dot '+(item.action.includes('🔒')?'dot-encrypt':'dot-decrypt')+'">'+item.action.split(' ')[0]+'</div><div class="activity-info"><div class="activity-action">'+item.action+' <span style="color:var(--sage);font-size:0.8rem">by '+item.user+'</span></div><div class="activity-filename">'+item.filename+'</div></div><div class="activity-time">'+item.time+'</div></div>').join('');
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────

function renderAdminPage() {
    const user=appState.currentUser;
    if(!user||user.role!=='admin') return;
    document.getElementById('adminStatUsers').textContent    = userStore.length;
    document.getElementById('adminStatAdmins').textContent   = userStore.filter(u=>u.role==='admin').length;
    document.getElementById('adminStatManagers').textContent = userStore.filter(u=>u.role==='manager').length;
    document.getElementById('adminStatOps').textContent      = appState.fileHistory.length;
    const tbody=document.getElementById('adminUserTableBody');
    tbody.innerHTML=userStore.map((u,idx)=>{
        const r=ROLES[u.role]||ROLES.user;
        const initials=u.name.split(' ').map(w=>w[0]).join('').toUpperCase();
        const isSelf=u.email===appState.currentUser.email;
        return '<tr class="'+(u.status==='suspended'?'row-suspended':'')+'"><td><div class="admin-user-cell"><div class="admin-user-avatar" style="background:'+r.color+'22;color:'+r.color+'">'+initials+'</div><span>'+u.name+(isSelf?' <span class="team-you-tag">you</span>':'')+'</span></div></td><td class="admin-email-cell">'+u.email+'</td><td><select class="admin-role-select" data-idx="'+idx+'"'+(isSelf?' disabled':'')+'><option value="user"'+(u.role==='user'?' selected':'')+'>👤 User</option><option value="manager"'+(u.role==='manager'?' selected':'')+'>👔 Manager</option><option value="admin"'+(u.role==='admin'?' selected':'')+'>🛡 Admin</option></select></td><td><span class="team-status-pill status-'+u.status+'">'+(u.status==='active'?'● Active':'○ Suspended')+'</span></td><td><div class="admin-actions">'+(isSelf?'<span style="opacity:0.35;font-size:0.8rem">—</span>':'<button class="admin-btn admin-btn-toggle" data-idx="'+idx+'" title="'+(u.status==='active'?'Suspend':'Activate')+'">'+(u.status==='active'?'🚫':'✅')+'</button><button class="admin-btn admin-btn-delete" data-idx="'+idx+'" title="Delete">🗑</button>')+'</div></td></tr>';
    }).join('');
    tbody.querySelectorAll('.admin-role-select').forEach(sel=>{
        sel.addEventListener('change',e=>{
            const idx=parseInt(e.target.dataset.idx), oldRole=userStore[idx].role, newRole=e.target.value;
            userStore[idx].role=newRole;
            addSystemLog('Role changed: '+userStore[idx].name+' → '+newRole+' (was '+oldRole+')');
            showSettingsToast('✓ '+userStore[idx].name+"'s role updated to "+newRole);
            renderAdminPage();
        });
    });
    tbody.querySelectorAll('.admin-btn-toggle').forEach(btn=>{
        btn.addEventListener('click',()=>{
            const idx=parseInt(btn.dataset.idx), u=userStore[idx];
            u.status=u.status==='active'?'suspended':'active';
            addSystemLog('User '+(u.status==='suspended'?'suspended':'reactivated')+': '+u.name);
            showSettingsToast((u.status==='suspended'?'🚫 Suspended':'✅ Reactivated')+': '+u.name);
            renderAdminPage();
        });
    });
    tbody.querySelectorAll('.admin-btn-delete').forEach(btn=>{
        btn.addEventListener('click',()=>{
            const idx=parseInt(btn.dataset.idx);
            if(!confirm('Delete user "'+userStore[idx].name+'"? This cannot be undone.')) return;
            const removed=userStore.splice(idx,1)[0];
            addSystemLog('User deleted: '+removed.name);
            showSettingsToast('🗑 Deleted: '+removed.name);
            renderAdminPage();
        });
    });
    const sysLog=document.getElementById('systemLog');
    if(appState.systemLog.length===0){ sysLog.innerHTML='<div class="activity-empty">No system events recorded.</div>'; return; }
    sysLog.innerHTML=appState.systemLog.map(item=>'<div class="activity-item"><div class="activity-dot" style="background:rgba(123,45,138,0.1)">🖥</div><div class="activity-info"><div class="activity-action" style="color:var(--deep-green)">'+item.msg+'</div></div><div class="activity-time">'+item.time+'</div></div>').join('');
}
document.getElementById('clearSystemLogBtn').addEventListener('click',()=>{ appState.systemLog=[]; renderAdminPage(); });

const addUserModal=document.getElementById('addUserModal');
document.getElementById('addUserBtn').addEventListener('click',()=>{
    addUserModal.classList.add('visible');
    ['addUserFirstName','addUserLastName','addUserEmail','addUserPassword'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('addUserRole').value='user';
    document.getElementById('addUserError').style.display='none';
});
document.getElementById('closeAddUserBtn').addEventListener('click',()=>addUserModal.classList.remove('visible'));
addUserModal.addEventListener('click',e=>{ if(e.target===addUserModal) addUserModal.classList.remove('visible'); });
document.getElementById('confirmAddUserBtn').addEventListener('click',()=>{
    const fn=document.getElementById('addUserFirstName').value.trim();
    const ln=document.getElementById('addUserLastName').value.trim();
    const em=document.getElementById('addUserEmail').value.trim();
    const pw=document.getElementById('addUserPassword').value;
    const rl=document.getElementById('addUserRole').value;
    const errEl=document.getElementById('addUserError');
    errEl.style.display='none';
    if(!fn||!ln){ errEl.textContent='Please enter first and last name.'; errEl.style.display='block'; return; }
    if(!em||!em.includes('@')){ errEl.textContent='Please enter a valid email.'; errEl.style.display='block'; return; }
    if(pw.length<6){ errEl.textContent='Password must be at least 6 chars.'; errEl.style.display='block'; return; }
    if(userStore.find(u=>u.email===em)){ errEl.textContent='Email already in use.'; errEl.style.display='block'; return; }
    const newUser={email:em,password:pw,name:fn+' '+ln,role:rl,status:'active',joined:new Date().toISOString().split('T')[0]};
    userStore.push(newUser);
    addSystemLog('Admin created user: '+newUser.name+' ['+rl+']');
    showSettingsToast('✓ User "'+newUser.name+'" created as '+rl);
    addUserModal.classList.remove('visible');
    renderAdminPage();
});

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────

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
document.getElementById('saveAccountBtn').addEventListener('click',()=>{
    const name=document.getElementById('settingName').value.trim(), email=document.getElementById('settingEmail').value.trim();
    if(!name) return showSettingsToast('⚠ Please enter a display name.');
    if(!email) return showSettingsToast('⚠ Please enter an email address.');
    if(appState.currentUser){ appState.currentUser.name=name; appState.currentUser.email=email; const initials=name.split(' ').map(w=>w[0]).join('').toUpperCase(); document.getElementById('avatarInitials').textContent=initials; document.getElementById('dropdownName').textContent=name; document.getElementById('dropdownEmail').textContent=email; }
    showSettingsToast('✓ Account details saved!');
});
document.getElementById('settingMinPass').addEventListener('change',e=>{ appState.settings.minPassLength=parseInt(e.target.value); showSettingsToast('✓ Security settings updated.'); });
document.getElementById('settingAutoClear').addEventListener('change',e=>{ appState.settings.autoClear=e.target.checked; });
document.getElementById('settingPassStrength').addEventListener('change',e=>{ appState.settings.showStrength=e.target.checked; if(!e.target.checked) encryptStrength.textContent=''; });
document.getElementById('settingTheme').addEventListener('change',e=>{ appState.settings.theme=e.target.value; applyTheme(e.target.value); showSettingsToast('✓ Theme applied!'); });
document.getElementById('settingReduceMotion').addEventListener('change',e=>{ appState.settings.reduceMotion=e.target.checked; document.body.style.setProperty('--anim-speed',e.target.checked?'0.01s':''); showSettingsToast(e.target.checked?'✓ Animations reduced.':'✓ Animations restored.'); });
document.getElementById('settingHistory').addEventListener('change',e=>{ appState.settings.saveHistory=e.target.checked; });
document.getElementById('clearAllDataBtn').addEventListener('click',()=>{ if(confirm('Clear all file history and activity logs?')){ appState.fileHistory=[]; appState.activityLog=[]; showSettingsToast('🗑 All data cleared.'); } });

function applyTheme(theme) {
    const root=document.documentElement;
    if(theme==='ocean'){ root.style.setProperty('--sage','#7aaccf'); root.style.setProperty('--forest','#2e6d9e'); root.style.setProperty('--deep-green','#1a3f5c'); root.style.setProperty('--terracotta','#5bc4c4'); root.style.setProperty('--earth','#4a7a8a'); root.style.setProperty('--clay','#88c4d8'); }
    else if(theme==='dusk'){ root.style.setProperty('--sage','#c4a0c8'); root.style.setProperty('--forest','#7b4d8a'); root.style.setProperty('--deep-green','#4a2060'); root.style.setProperty('--terracotta','#e88a7a'); root.style.setProperty('--earth','#8a5568'); root.style.setProperty('--clay','#d4a8b8'); }
    else { root.style.setProperty('--sage','#9caf88'); root.style.setProperty('--forest','#5a7355'); root.style.setProperty('--deep-green','#3d5a3d'); root.style.setProperty('--terracotta','#d4a373'); root.style.setProperty('--earth','#8b7355'); root.style.setProperty('--clay','#c8a882'); }
}
function showSettingsToast(msg) { const t=document.getElementById('settingsToast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }