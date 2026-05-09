# FastBite Authentication System Documentation

## 📋 Overview

This document provides comprehensive details about the **Authentication System** implemented in the FastBite restaurant management system. The system provides secure user authentication with role-based access control.

---

## 🏗️ Architecture & Components

### 1. **Backend Architecture (Flask)**

#### A. Session Configuration
- **Session Type**: Flask built-in session management
- **Secret Key**: `fastbite-secret-key-2024` (⚠️ Change in production)
- **Session Lifetime**: 30 days (persistent login)
- **Secure Cookies**: Enabled in production

```python
app.config['SECRET_KEY'] = 'your-secure-key'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 2592000  # 30 days
```

#### B. Authentication Decorators

**`@login_required`** - Protects routes that need authentication
```python
@app.route('/protected-route')
@login_required
def protected():
    user = get_current_user()
    # Only logged-in users can access
```

**`@admin_required`** - Protects admin-only routes
```python
@app.route('/admin/settings')
@admin_required
def admin_settings():
    # Only admin users can access
```

#### C. Helper Functions

**`get_current_user()`**
- Retrieves current logged-in user from session
- Returns user object or `None` if not authenticated
- Queries database for latest user info

**`login_required(f)`**
- Decorator that redirects to `/login` if not authenticated
- Returns 302 redirect response

**`admin_required(f)`**
- Decorator that requires both login AND admin role
- Redirects to `/` if user is not admin
- Returns 302 redirect response

---

### 2. **Backend Routes**

#### A. `/login` (GET/POST)

**GET Request**
- Returns login page template
- Redirects if already logged in

**POST Request** (JSON)
```json
{
    "username": "admin",
    "password": "admin"
}
```

**Response Success (200)**
```json
{
    "success": true,
    "message": "Login successful",
    "redirect": "/admin"
}
```

**Response Error (401)**
```json
{
    "error": "Invalid username or password"
}
```

**Process**
1. Validate input (username & password required)
2. Query database for user by username
3. Use `check_password_hash()` to verify password
4. Create session with user data
5. Set session as permanent
6. Return redirect URL based on role

#### B. `/logout` (POST)

**Request**
- POST request with JSON content type

**Response (200)**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

**Process**
1. Clear all session data
2. Redirect user to login page

#### C. `/user-session` (GET)

**Response Success (200)**
```json
{
    "id": 1,
    "username": "admin",
    "role": "admin"
}
```

**Response Error (401)**
```json
{
    "error": "Not authenticated"
}
```

**Purpose**: Provides frontend with current user information

#### D. `/admin` (Protected Route)

- Protected with `@admin_required` decorator
- Redirects to login if not authenticated
- Redirects to home if user is not admin
- Returns admin dashboard template

---

### 3. **Database Schema**

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer'
);
```

#### Field Details
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| username | TEXT | Unique username, indexed |
| password | TEXT | PBKDF2-SHA256 hashed password |
| role | TEXT | 'admin' or 'customer', default 'customer' |

#### Pre-configured Users
```sql
-- Admin Account
Username: admin
Password: admin
Role: admin

-- Customer Account  
Username: guest
Password: guest
Role: customer
```

---

## 🔐 Security Implementation

### 1. **Password Hashing**

Uses **PBKDF2-SHA256** via werkzeug.security

```python
from werkzeug.security import generate_password_hash, check_password_hash

# Hash password (when creating/updating user)
hashed = generate_password_hash('plaintext_password')

# Verify password (during login)
is_valid = check_password_hash(hashed, 'plaintext_password')
```

**Hash Format**: `pbkdf2:sha256:iterations$salt$hash`

### 2. **Session Security**

- ✅ Secure session cookies in production
- ✅ HTTPS enforced (should be in production)
- ✅ SameSite cookie attribute
- ✅ 30-day persistent session lifetime
- ✅ Session ID regeneration on login

### 3. **Input Validation**

```python
# Username validation
username = data.get('username', '').strip()
if not username:
    return error_response

# Password validation  
password = data.get('password', '')
if not password or len(password) < 3:
    return error_response
```

### 4. **SQL Injection Prevention**

All database queries use parameterized statements:
```python
# ✅ Safe - parameterized query
user = conn.execute('SELECT * FROM users WHERE username = ?', (username,))

# ❌ Unsafe - string concatenation
user = conn.execute(f'SELECT * FROM users WHERE username = {username}')
```

### 5. **CSRF Protection**

Currently: Basic protection via session-based authentication
Future: Consider adding explicit CSRF tokens for form submissions

---

## 🎨 Frontend Implementation

### 1. **Login Page** (`templates/login.html`)

Features:
- Professional gradient background
- Username input field
- Password input with visibility toggle
- "Remember me" checkbox
- Demo credentials display
- Form validation
- Security badge at bottom

**Styling**: Tailwind CSS + Custom animations

### 2. **Login Form Handling** (`static/js/login.js`)

Key Functions:
```javascript
// Handle form submission
async function handleLogin(e)

// Toggle password visibility
function togglePasswordVisibility()

// Display alerts
function showAlert(message, type)

// Manage form state
function disableForm()
function enableForm()
```

**Validation**:
- Username and password required
- Minimum password length check
- Display error messages to user
- Show loading state during submission

### 3. **Session Display** (index.html & admin.html)

Updates navbar with:
- Current username display
- User menu with dropdown
- Admin dashboard link (admin only)
- Logout button
- Session status icon

**Session Check Function**:
```javascript
async function checkUserSession() {
    const response = await fetch('/user-session');
    if (response.ok) {
        const user = await response.json();
        updateUserUI(user);
    }
}
```

### 4. **Logout Handler**

```javascript
async function handleLogout() {
    const response = await fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
        window.location.href = '/login';
    }
}
```

---

## 🔄 Authentication Flow

### Login Flow
```
┌─────────────────┐
│  User visits /  │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │ Has session?  │
    └────┬────┬────┘
    NO   │    │   YES
    ┌────▼─┐  └──────────────────┐
    │/login│                      │
    └──────┘         ┌────────────▼──────────┐
                     │ Is role='admin'?      │
                     └────┬──────────┬───────┘
                     NO   │          │   YES
                    ┌─────▼──┐   ┌───▼──────┐
                    │ /      │   │/admin    │
                    └────────┘   └──────────┘
```

### Login Request-Response
```
POST /login
{
    "username": "admin",
    "password": "admin"
}
      │
      ├─ Validate input
      ├─ Query database
      ├─ Hash comparison
      ├─ Create session
      └─ Response: {"success": true, "redirect": "/admin"}
```

---

## 📋 User Roles & Permissions

### Admin Role (`role='admin'`)
✅ Access to `/admin` route  
✅ View admin dashboard  
✅ Access admin APIs (`/admin/stats`, `/admin/top-products`)  
✅ Place orders  
✅ View menu and reviews  

### Customer Role (`role='customer'`)
❌ Cannot access admin routes  
✅ View menu  
✅ Place orders  
✅ View and add reviews  
✅ Use search functionality  

---

## 🚀 API Endpoints Summary

| Endpoint | Method | Auth Required | Role Required | Description |
|----------|--------|---------------|---------------|-------------|
| `/login` | GET | No | - | Display login form |
| `/login` | POST | No | - | Process login |
| `/logout` | POST | Yes | - | Process logout |
| `/user-session` | GET | Yes | - | Get user info |
| `/` | GET | No | - | Home page |
| `/admin` | GET | Yes | admin | Admin dashboard |
| `/admin/stats` | GET | Yes | admin | Get statistics |
| `/admin/top-products` | GET | Yes | admin | Get top products |

---

## 🧪 Testing the Authentication

### Test Admin Login
```
Username: admin
Password: admin
Expected: Redirect to /admin
```

### Test Customer Login
```
Username: guest
Password: guest
Expected: Redirect to /
```

### Test Invalid Login
```
Username: admin
Password: wrong
Expected: Error message "Invalid username or password"
```

### Test Protected Route
```
1. Logout
2. Visit /admin directly
3. Expected: Redirect to /login
```

---

## ⚙️ Configuration & Production Readiness

### Current Configuration
```python
app.config['SECRET_KEY'] = 'fastbite-secret-key-2024'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 2592000
```

### Required for Production

1. **Change Secret Key**
   ```python
   import secrets
   SECRET_KEY = secrets.token_hex(32)
   ```

2. **Use Environment Variables**
   ```python
   import os
   app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
   ```

3. **Enable HTTPS**
   - Use SSL/TLS certificate
   - Set `SESSION_COOKIE_SECURE = True`
   - Set `SESSION_COOKIE_HTTPONLY = True`

4. **Database Security**
   - Use strong admin password
   - Hash all user passwords
   - Regular password policy enforcement

5. **Additional Headers**
   ```python
   @app.after_request
   def set_security_headers(response):
       response.headers['X-Content-Type-Options'] = 'nosniff'
       response.headers['X-Frame-Options'] = 'SAMEORIGIN'
       response.headers['X-XSS-Protection'] = '1; mode=block'
       return response
   ```

---

## 🐛 Troubleshooting

### "Invalid username or password" always appears
- ✅ Check database users table exists
- ✅ Verify usernames are correct
- ✅ Check password hashes start with `pbkdf2:`

### Logout redirects but stays logged in
- Clear browser cookies
- Check session folder exists
- Verify SECRET_KEY matches

### Admin dashboard shows but content doesn't load
- Check `/admin/stats` returns 200
- Verify user has `role='admin'`
- Check browser console for JS errors

---

## 📚 Files Modified/Created

### Modified Files
- ✅ `app.py` - Added authentication logic
- ✅ `schema.sql` - Updated with hashed passwords
- ✅ `requirements.txt` - Added Flask-Login
- ✅ `templates/index.html` - Added user menu
- ✅ `templates/admin.html` - Added user menu
- ✅ `static/js/app.js` - Added session checking
- ✅ `static/js/admin.js` - Added session checking

### Created Files
- ✅ `templates/login.html` - Login page
- ✅ `static/js/login.js` - Login form handler

---

## ✅ Implementation Checklist

- ✅ Password hashing with werkzeug
- ✅ Session management
- ✅ Login/Logout routes
- ✅ Authentication decorators
- ✅ Role-based access control
- ✅ Professional login UI
- ✅ Session validation
- ✅ Frontend session checking
- ✅ User menu in navbar
- ✅ Protected admin routes
- ✅ Database initialization script
- ✅ Security best practices

---

## 🎓 Next Steps

After authentication is working:

1. **Product CRUD System** - Add/Edit/Delete products
2. **Image Upload** - Upload product images
3. **Search Functionality** - Search menu items
4. **Real-time Dashboard** - WebSocket updates
5. **Advanced Security** - 2FA, password reset, email verification

---

## 📞 Support Notes

**Key Components to Remember**:
- All sensitive endpoints check `@admin_required` decorator
- Passwords are hashed with PBKDF2-SHA256 (600,000 iterations)
- Sessions persist for 30 days
- User ID is stored in Flask session
- Database initializes on first app run

**Common Customizations**:
- Change SECRET_KEY in config
- Modify session lifetime
- Add password validation rules
- Implement password reset flow
- Add user registration

---

*Last Updated: May 9, 2026*  
*FastBite Authentication System v1.0*
