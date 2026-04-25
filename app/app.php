<?php require_once __DIR__ . '/../config/db.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Encryptify - PDF Protection</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/jquery.dataTables.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/styles.css">
</head>
<body>

<div class="texture-overlay"></div>

<!-- ── LOGIN SCREEN ── -->
<div id="loginScreen">
    <div class="login-card">
        <div class="login-logo">
            <span class="login-logo-icon">🔐</span>
            <h1>Encryptify</h1>
            <p>PDF Protection Suite</p>
        </div>
        <div class="login-divider"><span></span><p>Sign in to continue</p><span></span></div>
        <div class="login-error" id="loginError">Invalid email or password.</div>
        <div class="login-field">
            <label>Email Address</label>
            <input type="email" id="loginEmail" placeholder="you@example.com">
        </div>
        <div class="login-field">
            <label>Password</label>
            <input type="password" id="loginPassword" placeholder="enter password...">
        </div>
        <div class="login-options">
            <label><input type="checkbox" id="rememberMe"> Remember me</label>
            <a href="#">Forgot password?</a>
        </div>
        <button class="btn-login" id="loginBtn">Sign In</button>
        <div class="demo-accounts">
            <div class="demo-accounts-title">Demo Accounts — click to fill</div>
            <div class="demo-accounts-grid">
                <button class="demo-pill demo-user"    onclick="fillDemo('demo@encryptify.app','demo1234')">👤 User</button>
                <button class="demo-pill demo-manager" onclick="fillDemo('manager@encryptify.app','manager123')">👔 Manager</button>
                <button class="demo-pill demo-admin"   onclick="fillDemo('admin@encryptify.app','admin123')">🛡 Admin</button>
            </div>
        </div>
        <div class="login-footer">Don't have an account? <a href="#" id="openRegisterBtn">Create one free</a></div>
    </div>
</div>

<!-- ── REGISTER MODAL ── -->
<div id="registerModal">
    <div class="register-card">
        <button class="register-close" id="closeRegisterBtn">✕</button>
        <div class="login-logo">
            <span class="login-logo-icon">🌿</span>
            <h1>Create Account</h1>
            <p>Join Encryptify for free</p>
        </div>
        <div class="login-divider"><span></span><p>Fill in your details</p><span></span></div>
        <div class="register-error" id="registerError"></div>
        <div class="register-success" id="registerSuccess"></div>
        <div class="register-row">
            <div class="login-field"><label>First Name</label><input type="text" id="regFirstName" placeholder="Jane"></div>
            <div class="login-field"><label>Last Name</label><input type="text" id="regLastName" placeholder="Doe"></div>
        </div>
        <div class="login-field"><label>Email Address</label><input type="email" id="regEmail" placeholder="you@example.com"></div>
        <div class="login-field"><label>Password</label><input type="password" id="regPassword" placeholder="min. 6 characters"></div>
        <div class="login-field"><label>Confirm Password</label><input type="password" id="regConfirmPassword" placeholder="repeat password"></div>
        <div class="register-terms">
            <label><input type="checkbox" id="agreeTerms"> I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
        </div>
        <button class="btn-login" id="registerBtn">Create Free Account</button>
        <div class="login-footer">Already have an account? <a href="#" id="backToLoginBtn">Sign in</a></div>
    </div>
</div>

<!-- ── APP SCREEN ── -->
<div id="appScreen">
    <nav>
        <a class="nav-brand" href="#" id="navBrandLink">
            <span class="nav-brand-icon">🔐</span>
            <span class="nav-brand-name">Encryptify</span>
        </a>
        <ul class="nav-links">
            <li><a href="#" class="active" data-page="dashboard">⊞ &nbsp;Dashboard</a></li>
            <li><a href="#" data-page="files">📄 &nbsp;My Files</a></li>
            <li><a href="#" data-page="activity">📊 &nbsp;Activity</a></li>
            <li class="nav-item-manager" style="display:none"><a href="#" data-page="team">👥 &nbsp;Team</a></li>
            <li class="nav-item-admin"   style="display:none"><a href="#" data-page="admin">🛡 &nbsp;Admin</a></li>
            <li><a href="#" data-page="settings">⚙️ &nbsp;Settings</a></li>
        </ul>
        <div class="nav-right">
            <span class="nav-badge" id="navRoleBadge">Pro</span>
            <div class="nav-avatar" tabindex="0" id="navAvatar">
                <span id="avatarInitials">--</span>
                <div class="avatar-dropdown">
                    <div class="avatar-dropdown-header">
                        <div class="avatar-dropdown-name"  id="dropdownName">User</div>
                        <div class="avatar-dropdown-email" id="dropdownEmail"></div>
                        <div class="avatar-dropdown-role"  id="dropdownRole"></div>
                    </div>
                    <a href="#" class="logout" id="logoutBtn">→ &nbsp;Sign Out</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- DASHBOARD -->
    <div id="page-dashboard" class="page-view active-page">
        <div class="container">
            <header><h1 class="logo-text">Encryptify</h1><p class="tagline">PDF Protection</p></header>

            <!-- ── USER DASHBOARD (all roles see encrypt/decrypt) ── -->
            <div id="dashUserSection">
                <div class="main-container">
                    <div class="card">
                        <div class="card-header"><span class="card-icon">🔒</span><h2 class="card-title">Encrypt</h2></div>
                        <div class="upload-area" id="encryptUpload">
                            <div class="upload-icon">📄</div>
                            <div class="upload-text">Drop your PDF here</div>
                            <div class="upload-hint">or click to browse</div>
                            <input type="file" id="encryptFile" accept=".pdf">
                        </div>
                        <div class="file-display" id="encryptFileDisplay">
                            <div class="file-icon">📄</div>
                            <div class="file-info"><div class="file-name" id="encryptFileName"></div><div class="file-size" id="encryptFileSize"></div></div>
                            <button class="file-remove-btn" id="encryptRemoveBtn" title="Remove file">✕</button>
                        </div>
                        <div class="input-group">
                            <label for="encryptPassword">Protection Password</label>
                            <input type="password" id="encryptPassword" placeholder="Enter password...">
                            <div class="password-strength" id="encryptStrength"></div>
                        </div>
                        <button class="btn btn-encrypt" id="encryptBtn" disabled>Protect PDF</button>
                    </div>
                    <div class="card">
                        <div class="card-header"><span class="card-icon">🔓</span><h2 class="card-title">Decrypt</h2></div>
                        <div class="upload-area" id="decryptUpload">
                            <div class="upload-icon">🔐</div>
                            <div class="upload-text">Drop encrypted PDF</div>
                            <div class="upload-hint">or click to browse</div>
                            <input type="file" id="decryptFile" accept=".pdf">
                        </div>
                        <div class="file-display" id="decryptFileDisplay">
                            <div class="file-icon">🔐</div>
                            <div class="file-info"><div class="file-name" id="decryptFileName"></div><div class="file-size" id="decryptFileSize"></div></div>
                            <button class="file-remove-btn" id="decryptRemoveBtn" title="Remove file">✕</button>
                        </div>
                        <div class="input-group">
                            <label for="decryptPassword">Enter Password</label>
                            <input type="password" id="decryptPassword" placeholder="Enter password...">
                        </div>
                        <button class="btn btn-decrypt" id="decryptBtn" disabled>Unlock PDF</button>
                    </div>
                </div>
                <div class="status-container" id="statusContainer">
                    <div class="status-text">Upload a PDF to begin your journey</div>
                    <div class="progress-bar" id="progressBar"><div class="progress-fill" id="progressFill"></div></div>
                </div>
            </div>

            <!-- ── MANAGER DASHBOARD EXTRAS ── -->
            <div id="dashManagerSection" style="display:none;">
                <div class="dash-section-title">👔 Manager Overview</div>
                <div class="activity-stats-row mb-32">
                    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value" id="dashMgrMembers">—</div><div class="stat-label">Team Members</div></div>
                    <div class="stat-card"><div class="stat-icon">🔒</div><div class="stat-value" id="dashMgrEncrypted">—</div><div class="stat-label">Team Encrypted</div></div>
                    <div class="stat-card"><div class="stat-icon">🔓</div><div class="stat-value" id="dashMgrDecrypted">—</div><div class="stat-label">Team Decrypted</div></div>
                    <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" id="dashMgrActive">—</div><div class="stat-label">Active Members</div></div>
                </div>
                <div class="activity-card">
                    <div class="activity-card-header"><span class="activity-card-title">👥 &nbsp;Team Quick View</span><a href="#" class="dash-view-all" onclick="switchPage('team');return false;">View Full Team →</a></div>
                    <div id="dashMgrTeamList" class="team-members-list"></div>
                </div>
            </div>

            <!-- ── ADMIN DASHBOARD EXTRAS ── -->
            <div id="dashAdminSection" style="display:none;">
                <div class="dash-section-title">🛡 Admin Overview</div>
                <div class="activity-stats-row mb-32">
                    <div class="stat-card"><div class="stat-icon">👤</div><div class="stat-value" id="dashAdmUsers">—</div><div class="stat-label">Total Users</div></div>
                    <div class="stat-card"><div class="stat-icon">🛡</div><div class="stat-value" id="dashAdmAdmins">—</div><div class="stat-label">Admins</div></div>
                    <div class="stat-card"><div class="stat-icon">👔</div><div class="stat-value" id="dashAdmManagers">—</div><div class="stat-label">Managers</div></div>
                    <div class="stat-card"><div class="stat-icon">🔐</div><div class="stat-value" id="dashAdmOps">—</div><div class="stat-label">Total Operations</div></div>
                </div>
                <div class="activity-stats-row mb-32">
                    <div class="activity-card" style="flex:1">
                        <div class="activity-card-header"><span class="activity-card-title">👤 &nbsp;Recent Users</span><a href="#" class="dash-view-all" onclick="switchPage('admin');return false;">Manage Users →</a></div>
                        <div id="dashAdmUserList"></div>
                    </div>
                    <div class="activity-card" style="flex:1">
                        <div class="activity-card-header"><span class="activity-card-title">🖥 &nbsp;Recent System Events</span><a href="#" class="dash-view-all" onclick="switchPage('activity');return false;">Full Log →</a></div>
                        <div id="dashAdmRecentLog" class="activity-log"></div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- MY FILES -->
    <div id="page-files" class="page-view">
        <div class="container">
            <header><h1 class="logo-text">My Files</h1><p class="tagline">Your Protected Documents</p></header>
            <div class="files-toolbar">
                <div class="files-search-wrap">
                    <span class="files-search-icon">🔍</span>
                    <input type="text" id="filesSearch" class="files-search" placeholder="Search files...">
                </div>
                <div class="files-filter-btns">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="encrypted">🔒 Encrypted</button>
                    <button class="filter-btn" data-filter="decrypted">🔓 Decrypted</button>
                </div>
            </div>
            <div class="files-grid" id="filesGrid"></div>
            <div class="files-empty" id="filesEmpty">
                <div class="files-empty-icon">📂</div>
                <div class="files-empty-title">No files yet</div>
                <div class="files-empty-sub">Files you encrypt or decrypt will appear here.</div>
                <button class="btn-go-dash" onclick="switchPage('dashboard')">Go to Dashboard</button>
            </div>
        </div>
    </div>

    <!-- ACTIVITY -->
    <div id="page-activity" class="page-view">
        <div class="container">
            <header><h1 class="logo-text">Activity</h1><p class="tagline">Your Recent Actions</p></header>
            <div class="activity-stats-row">
                <div class="stat-card"><div class="stat-icon">🔒</div><div class="stat-value" id="statEncrypted">0</div><div class="stat-label">Files Encrypted</div></div>
                <div class="stat-card"><div class="stat-icon">🔓</div><div class="stat-value" id="statDecrypted">0</div><div class="stat-label">Files Decrypted</div></div>
                <div class="stat-card"><div class="stat-icon">📁</div><div class="stat-value" id="statTotal">0</div><div class="stat-label">Total Files</div></div>
                <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-value" id="statToday">0</div><div class="stat-label">Today</div></div>
            </div>
            <div class="activity-card">
                <div class="activity-card-header">
                    <span class="activity-card-title">📋 &nbsp;Activity Log</span>
                    <button class="btn-clear-log" id="clearLogBtn">Clear Log</button>
                </div>
                <div class="activity-table-wrap">
                    <table id="activityDataTable" class="activity-dt-table" style="width:100%">
                        <thead>
                            <tr>
                                <th>Date &amp; Time</th>
                                <th>User</th>
                                <th>Action / Message</th>
                                <th>Page</th>
                                <th>IP Address</th>
                                <th>Browser</th>
                            </tr>
                        </thead>
                        <tbody id="activityDtBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- TEAM (Manager + Admin) -->
    <div id="page-team" class="page-view">
        <div class="container">
            <header><h1 class="logo-text">Team Overview</h1><p class="tagline">Monitor Team Activity</p></header>
            <div class="activity-stats-row mb-32">
                <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value" id="teamStatMembers">0</div><div class="stat-label">Team Members</div></div>
                <div class="stat-card"><div class="stat-icon">🔒</div><div class="stat-value" id="teamStatEncrypted">0</div><div class="stat-label">Total Encrypted</div></div>
                <div class="stat-card"><div class="stat-icon">🔓</div><div class="stat-value" id="teamStatDecrypted">0</div><div class="stat-label">Total Decrypted</div></div>
                <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" id="teamStatActive">0</div><div class="stat-label">Active Members</div></div>
            </div>
            <div class="activity-card">
                <div class="activity-card-header">
                    <span class="activity-card-title">👥 &nbsp;Team Members</span>
                    <span class="team-subtitle" id="teamSubtitle"></span>
                </div>
                <div id="teamMembersList" class="team-members-list"></div>
            </div>
            <div class="activity-card mt-24">
                <div class="activity-card-header"><span class="activity-card-title">📋 &nbsp;Team Activity Log</span></div>
                <div class="activity-log" id="teamActivityLog"><div class="activity-empty">No team activity yet.</div></div>
            </div>
        </div>
    </div>

    <!-- ADMIN -->
    <div id="page-admin" class="page-view">
        <div class="container">
            <header><h1 class="logo-text">Admin Panel</h1><p class="tagline">User &amp; System Management</p></header>
            <div class="activity-stats-row mb-32">
                <div class="stat-card"><div class="stat-icon">👤</div><div class="stat-value" id="adminStatUsers">0</div><div class="stat-label">Total Users</div></div>
                <div class="stat-card"><div class="stat-icon">🛡</div><div class="stat-value" id="adminStatAdmins">0</div><div class="stat-label">Admins</div></div>
                <div class="stat-card"><div class="stat-icon">👔</div><div class="stat-value" id="adminStatManagers">0</div><div class="stat-label">Managers</div></div>
                <div class="stat-card"><div class="stat-icon">🔐</div><div class="stat-value" id="adminStatOps">0</div><div class="stat-label">Total Operations</div></div>
            </div>
            <div class="activity-card">
                <div class="activity-card-header">
                    <span class="activity-card-title">👤 &nbsp;User Management</span>
                    <button class="btn-admin-add" id="addUserBtn">+ Add User</button>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table" id="adminUserTable">
                        <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody id="adminUserTableBody"></tbody>
                    </table>
                </div>
            </div>
            <div class="activity-card mt-24">
                <div class="activity-card-header">
                    <span class="activity-card-title">🖥 &nbsp;System Log</span>
                    <button class="btn-clear-log" id="clearSystemLogBtn">Clear</button>
                </div>
                <div class="activity-log" id="systemLog"><div class="activity-empty">No system events recorded.</div></div>
            </div>
        </div>
    </div>

    <!-- SETTINGS -->
    <div id="page-settings" class="page-view">
        <div class="container">
            <header><h1 class="logo-text">Settings</h1><p class="tagline">Preferences &amp; Account</p></header>
            <div class="settings-grid">
                <div class="settings-section">
                    <div class="settings-section-title">👤 Account</div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Display Name</div><div class="settings-label-sub">Shown in the navigation bar</div></div><input type="text" class="settings-input" id="settingName" placeholder="Your name"></div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Email Address</div><div class="settings-label-sub">Used for login</div></div><input type="email" class="settings-input" id="settingEmail" placeholder="you@example.com"></div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Role</div><div class="settings-label-sub">Your current access level</div></div><span class="settings-role-badge" id="settingsRoleBadge"></span></div>
                    <div class="settings-row settings-row-end"><div></div><button class="btn-settings-save" id="saveAccountBtn">Save Changes</button></div>
                </div>
                <div class="settings-section">
                    <div class="settings-section-title">🔐 Security</div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Minimum Password Length</div><div class="settings-label-sub">For encrypting PDFs</div></div><select class="settings-select" id="settingMinPass"><option value="6">6 characters</option><option value="8">8 characters</option><option value="12">12 characters</option><option value="16">16 characters</option></select></div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Auto-clear Password Fields</div><div class="settings-label-sub">Clear after each operation</div></div><label class="toggle-switch"><input type="checkbox" id="settingAutoClear" checked><span class="toggle-track"><span class="toggle-thumb"></span></span></label></div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Show Password Strength</div><div class="settings-label-sub">Display strength indicator while typing</div></div><label class="toggle-switch"><input type="checkbox" id="settingPassStrength" checked><span class="toggle-track"><span class="toggle-thumb"></span></span></label></div>
                </div>
                <div class="settings-section">
                    <div class="settings-section-title">🎨 Appearance</div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Theme</div><div class="settings-label-sub">Interface color scheme</div></div><select class="settings-select" id="settingTheme"><option value="natural">🌿 Natural (Default)</option><option value="ocean">🌊 Ocean</option><option value="dusk">🌅 Dusk</option></select></div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Reduce Animations</div><div class="settings-label-sub">For better performance</div></div><label class="toggle-switch"><input type="checkbox" id="settingReduceMotion"><span class="toggle-track"><span class="toggle-thumb"></span></span></label></div>
                </div>
                <div class="settings-section">
                    <div class="settings-section-title">🗂️ Storage &amp; Privacy</div>
                    <div class="settings-row"><div class="settings-label"><div class="settings-label-main">Save File History</div><div class="settings-label-sub">Keep a log of encrypted/decrypted files</div></div><label class="toggle-switch"><input type="checkbox" id="settingHistory" checked><span class="toggle-track"><span class="toggle-thumb"></span></span></label></div>
                    <div class="settings-row settings-row-end"><div class="settings-label"><div class="settings-label-main">Clear All Data</div><div class="settings-label-sub">Remove all file history and activity logs</div></div><button class="btn-settings-danger" id="clearAllDataBtn">Clear Data</button></div>
                </div>
            </div>
            <div class="settings-toast" id="settingsToast"></div>
        </div>
    </div>
</div>

<!-- ── ADD USER MODAL ── -->
<div id="addUserModal">
    <div class="register-card">
        <button class="register-close" id="closeAddUserBtn">✕</button>
        <div class="login-logo"><span class="login-logo-icon">➕</span><h1>Add User</h1><p>Create a new team member</p></div>
        <div class="login-divider"><span></span><p>Fill in details</p><span></span></div>
        <div class="register-error" id="addUserError"></div>
        <div class="register-row">
            <div class="login-field"><label>First Name</label><input type="text" id="addUserFirstName" placeholder="Jane"></div>
            <div class="login-field"><label>Last Name</label><input type="text" id="addUserLastName" placeholder="Doe"></div>
        </div>
        <div class="login-field"><label>Email Address</label><input type="email" id="addUserEmail" placeholder="you@example.com"></div>
        <div class="login-field"><label>Password</label><input type="password" id="addUserPassword" placeholder="min. 6 characters"></div>
        <div class="login-field">
            <label>Role</label>
            <select class="settings-select" id="addUserRole">
                <option value="user">👤 User</option>
                <option value="manager">👔 Manager</option>
                <option value="admin">🛡 Admin</option>
            </select>
        </div>
        <button class="btn-login" id="confirmAddUserBtn">Create User</button>
    </div>
</div>

<!-- CryptoJS — client-side PDF encrypt/decrypt -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
<!-- jQuery + DataTables -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>

<!-- Inject BASE_URL so script.js builds the correct API path -->
<script>
    const APP_BASE_URL = '<?= BASE_URL ?>';
</script>
<script src="<?= BASE_URL ?>/assets/js/script.js"></script>
</body>
</html>
