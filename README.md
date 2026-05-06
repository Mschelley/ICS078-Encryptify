# Encryptify - PDF Protection System

A PHP web application for AES-based PDF encryption and decryption with role-based access control, activity logging, and an admin dashboard.

> **Scope:** This README covers the software development only. IoT/RFID hardware integration is documented separately.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8+ (procedural, no framework) |
| Database | MySQL 8 via PDO |
| Frontend | Vanilla JS, HTML5, CSS3 |
| Encryption | CryptoJS AES (client-side) |
| Charts | Chart.js |
| Hosting | Shared hosting / XAMPP (localhost) |

---

## Project Structure

```
ICS078-Encryptify/
├── index.php                  # Landing / login page
├── app/
│   └── app.php                # Main SPA (dashboard, admin, settings)
├── api/
│   ├── router.php             # Central POST dispatcher
│   ├── auth.php               # Login, logout, register, session
│   ├── users.php              # User management (admin/manager)
│   ├── logs.php               # Activity and system logs
│   ├── files.php              # File operation logging
│   └── settings.php           # User preferences
├── config/
│   └── db.php                 # PDO singleton + app constants
├── database/
│   └── schema.sql             # Full DB schema + demo accounts
└── assets/
    ├── css/styles.css
    └── js/script.js
```

---

## Database Setup

1. Create the database and import the schema:

```bash
mysql -u root -p < database/schema.sql
```

Or import via phpMyAdmin.

2. Update `config/db.php` with your credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'encryptify');
define('DB_USER', 'root');
define('DB_PASS', '');
define('BASE_URL', 'http://localhost/ICS078-Encryptify');
```

### Demo Accounts

| Email | Password | Role |
|---|---|---|
| demo@encryptify.app | demo1234 | User |
| manager@encryptify.app | manager123 | Manager |
| admin@encryptify.app | admin123 | Admin |

---

## Running Locally (XAMPP)

1. Clone or extract the project into your XAMPP `htdocs` folder:
   ```
   C:/xampp/htdocs/ICS078-Encryptify/
   ```
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Import `database/schema.sql` via phpMyAdmin.
4. Open your browser and go to:
   ```
   http://localhost/ICS078-Encryptify/
   ```

---

## Features

### PDF Encryption & Decryption
- Drag-and-drop or click-to-browse PDF upload
- AES encryption runs entirely **client-side** via CryptoJS — the raw PDF never leaves the browser unencrypted
- Password strength indicator with configurable minimum length
- Encrypted files download automatically as `filename_protected.pdf`
- Decrypted files download as `filename_unlocked.pdf`

### Role-Based Access Control
Three roles with progressively wider permissions:

| Role | Dashboard | My Files | Activity | Team | Admin Panel |
|---|:---:|:---:|:---:|:---:|:---:|
| User | ✓ | ✓ | ✓ | | |
| Manager | ✓ | ✓ | ✓ | ✓ | |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

### Admin Dashboard
- Chart.js visualizations: line chart (daily activity), bar chart (operations), doughnut chart (user roles)
- User management: create, suspend, change roles
- Activity log with IP address, browser, and page tracking
- System log viewer

### Activity Log (Admin)
Tracked per action: user name, role, message, IP address, browser, page, timestamp.

### User Settings
- Minimum password length
- Auto-clear password field after operation
- Show/hide password strength indicator
- Theme selection
- Save file history toggle

---

## API Reference

All API calls go through `api/router.php` as `POST` requests with an `action` field.

### Auth
| Action | Description |
|---|---|
| `login` | Authenticate with email + password |
| `logout` | Destroy session |
| `register` | Create new account |
| `check_session` | Verify active session |

### Users (admin/manager)
| Action | Description |
|---|---|
| `get_users` | List all users |
| `create_user` | Add new user |
| `update_user` | Edit role or status |
| `delete_user` | Remove user |

### Logs (admin)
| Action | Description |
|---|---|
| `get_activity_logs` | Fetch activity log (last 500) |
| `get_system_logs` | Fetch system log |
| `log_page_visit` | Record page navigation |

### Files
| Action | Description |
|---|---|
| `log_file_action` | Log encrypt/decrypt operation |
| `get_file_history` | Fetch user's file history |

### Settings
| Action | Description |
|---|---|
| `get_settings` | Load user preferences |
| `save_settings` | Save user preferences |

---

## Known Bugs Fixed During Development

| Bug | File | Fix |
|---|---|---|
| `appendChild` crash on `showStatus()` | `assets/js/script.js` | `progressBar` and `progressFill` elements were missing from the HTML entirely. Added them to `#statusContainer` in `app.php`; rewrote `showStatus()` to use DOM manipulation instead of `innerHTML=` which was detaching the progress bar on every call. |
| Dead code after `respond()` in `get_activity_logs` | `api/logs.php` | Removed unreachable second `respond(['logs' => ...])` + `break` that appeared after the one that already ran. |
| Modal event listeners attaching before DOM was ready | `assets/js/script.js` | Added `defer` to both `<script>` tags in `app.php` so the full HTML is parsed before any script executes. |

---

## Development Notes

- All encryption/decryption is client-side. The server only handles auth, logging, and user management - it never sees plaintext PDFs.
- The API uses a single POST endpoint (`router.php`) with an `action` field to dispatch to the correct handler. No REST routing library is used.
- Sessions are PHP native sessions. No JWT.
- Passwords are hashed with `password_hash()` (bcrypt, cost 10).
- The SPA is a single `app.php` file - page navigation is handled by JS showing/hiding sections, not by actual page loads.
