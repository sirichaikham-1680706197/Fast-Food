# FastBite Authentication - Visual Reference Guide

## 🎯 Authentication System Overview

```
┌─────────────────────────────────────────────────────────────┐
│          FastBite Restaurant Management System              │
│                  Authentication System v1.0                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Frontend Layer  │
├──────────────────┤
│ • login.html     │  ← Professional login form
│ • index.html     │  ← Customer store with user menu
│ • admin.html     │  ← Admin dashboard with user menu
│ • app.js         │  ← Session checking & logout
│ • admin.js       │  ← Admin session management
│ • login.js       │  ← Form validation & submission
└──────────┬───────┘
           │
           ↓
┌──────────────────────────────────────────────────────────────┐
│  API Layer (Flask Routes)                                    │
├──────────────────────────────────────────────────────────────┤
│ POST   /login           → Verify credentials + create session│
│ POST   /logout          → Clear session + redirect           │
│ GET    /user-session    → Get current user info             │
│ GET    /admin           → Protected route (@admin_required)  │
│ GET    /admin/stats     → Protected API endpoint             │
│ GET    /admin/top-products → Protected API endpoint          │
└──────────┬───────────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────────┐
│  Business Logic Layer                                        │
├──────────────────────────────────────────────────────────────┤
│ • Authentication decorators (@login_required, @admin_required)
│ • Password hashing (PBKDF2-SHA256)                           │
│ • Session management (Flask built-in)                        │
│ • Role-based access control (admin/customer)                 │
│ • User lookup and validation                                 │
└──────────┬───────────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────────────────────┐
│  Database Layer (SQLite)                                     │
├──────────────────────────────────────────────────────────────┤
│ Table: users                                                 │
│ ├─ id (INTEGER)           → Primary key                      │
│ ├─ username (TEXT)        → Unique identifier               │
│ ├─ password (TEXT)        → PBKDF2-SHA256 hashed            │
│ └─ role (TEXT)            → 'admin' or 'customer'           │
│                                                              │
│ Pre-configured:                                              │
│ ├─ admin / admin (role: admin)                              │
│ └─ guest / guest (role: customer)                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 User Flow Diagrams

### Login Flow
```
┌─────────────────────────┐
│ User visits /login      │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────────────────────┐
│ Enter credentials                       │
│ • Username: admin                       │
│ • Password: admin                       │
└───────────┬─────────────────────────────┘
            │
            ↓
        [JavaScript]
┌──────────────────────────────────────────────────────────────┐
│ 1. Validate input (not empty)                                │
│ 2. POST to /login with JSON payload                          │
│ 3. Show loading spinner                                      │
└───────────┬─────────────────────────────────────────────────┘
            │
            ↓
        [Flask Backend]
┌──────────────────────────────────────────────────────────────┐
│ 1. Extract username & password from request                  │
│ 2. Query database: SELECT * FROM users WHERE username = ?    │
│ 3. Use check_password_hash(stored_hash, submitted_password)  │
│ 4. If valid:                                                 │
│    - Create session['user_id'] = user.id                     │
│    - Create session['username'] = user.username              │
│    - Create session['role'] = user.role                      │
│    - Return {"redirect": "/admin" or "/"}                    │
│ 5. If invalid:                                               │
│    - Return {"error": "Invalid username or password"}        │
└───────────┬─────────────────────────────────────────────────┘
            │
        ┌───┴──────┬────────────────┐
        │ Valid    │ Invalid        │
        ↓          ↓                │
    ┌───────┐  ┌─────────┐          │
    │Redirect  Show Error           │
    │to /admin Message              │
    └────────┘ └──────┬──────────────┘
        │             │
        ↓             ↓
    ┌──────────────────────────┐
    │ Update UI                │
    │ • Show username in menu  │
    │ • Show/hide admin link   │
    │ • Hide login button      │
    │ • Show logout button     │
    └──────────────────────────┘
```

### Access Control Flow
```
User requests /admin
        │
        ↓
┌─────────────────────────────────────────┐
│ @admin_required decorator checks:       │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴──────┐
         │             │
    session?          No → Redirect /login
    exists?               │
         │                │
         Yes              ↓
         │            User logs in
         │            (back to login flow)
         ↓
┌─────────────────────────────────────────┐
│ Get current user from session           │
│ Check user.role == 'admin'              │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴──────┐
         │             │
       Yes           No → Redirect /
         │             │ (customer access denied)
         │             ↓
         │          Show home page
         ↓
┌─────────────────────────────────────────┐
│ Load /admin template                    │
│ Display admin dashboard                 │
│ Fetch /admin/stats (with session cookie)│
│ Fetch /admin/top-products               │
└─────────────────────────────────────────┘
```

---

## 🔐 Password Hashing Explained

### How Password Hashing Works
```
┌─────────────────┐
│ Plain Password  │
│  "admin"        │
└────────┬────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────┐
│ Using: werkzeug.security.generate_password_hash()       │
│ Algorithm: PBKDF2-SHA256                                │
│ Iterations: 600,000                                      │
│ Process:                                                 │
│  1. Generate random salt                                │
│  2. Derive key using PBKDF2                             │
│  3. Combine salt + hash                                 │
└────────┬─────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────┐
│ Hashed Output:                                          │
│ pbkdf2:sha256:600000$salt$hash                          │
│                                                          │
│ Format breakdown:                                        │
│ pbkdf2 → Algorithm family                              │
│ sha256 → Hash function                                 │
│ 600000 → Number of iterations                          │
│ $salt → Random salt value                              │
│ $hash → Final hash value                               │
└────────┬─────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────┐
│ Stored in Database:                                      │
│ pbkdf2:sha256:600000$XFG78QZtSbxa9GoJ$746164da95b25... │
│                                                          │
│ ✓ Never store plain password                            │
│ ✓ Each password has unique salt                         │
│ ✓ Takes ~0.1 seconds to hash (prevents brute force)    │
│ ✓ Practically impossible to reverse                     │
└──────────────────────────────────────────────────────────┘

During Login:
┌────────────────────────────────────┐
│ User submits: "admin"              │
└────────────┬──────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────┐
│ Using: werkzeug.security.check_password_hash()        │
│                                                        │
│ Process:                                              │
│  1. Extract salt from stored hash                    │
│  2. Hash submitted password with same salt           │
│  3. Compare new hash with stored hash                │
└────────────┬──────────────────────────────────────────┘
             │
        ┌────┴─────┐
        │           │
     Match      Mismatch
        │           │
        Yes        No
        │          │
        ↓          ↓
    Success    Error
    Login OK   "Invalid password"
```

---

## 🌐 Session Lifecycle

```
┌─────────────────────────────┐
│ User visits /login          │
└──────────────┬──────────────┘
               │
               ↓
     [No session exists]
               │
               ↓
┌─────────────────────────────────────┐
│ POST /login with credentials        │
└──────────────┬──────────────────────┘
               │
               ↓
     [Backend validates]
               │
               ↓
┌──────────────────────────────────────────────────────┐
│ CREATE SESSION:                                      │
│ • session['user_id'] = 1                             │
│ • session['username'] = 'admin'                      │
│ • session['role'] = 'admin'                          │
│ • session.permanent = True                           │
│ • Lifetime: 30 days                                  │
└──────────────┬─────────────────────────────────────┘
               │
               ↓
     [Session stored in filesystem]
     [Session cookie sent to browser]
               │
               ↓
┌──────────────────────────────────────────────────────┐
│ Browser stores session cookie                        │
│ Sends cookie with every request                      │
└──────────────┬─────────────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
     ↓                    ↓
[Request to /admin]  [Request to /other]
     │                    │
     ↓                    ↓
[Backend checks session]  [No protection]
     │                    │
     ↓                    ↓
[Load dashboard]     [Load page]
     │                    │
     └────────┬───────────┘
              │
              ↓
    [User clicks logout]
              │
              ↓
┌──────────────────────────────────────────────────────┐
│ POST /logout                                         │
└──────────────┬─────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────┐
│ DESTROY SESSION:                                     │
│ • session.clear()                                    │
│ • All session data removed                           │
│ • Session file deleted                               │
└──────────────┬─────────────────────────────────────┘
               │
               ↓
     [Redirect to /login]
               │
               ↓
┌──────────────────────────────────────────────────────┐
│ Next request has no session                          │
│ User sees login form                                 │
│ Admin routes redirect to /login                      │
└──────────────────────────────────────────────────────┘
```

---

## 📊 API Response Examples

### Login Success
```
REQUEST:
POST /login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin"
}

RESPONSE: 200 OK
{
    "success": true,
    "message": "Login successful",
    "redirect": "/admin"
}

HTTP Headers:
Set-Cookie: session=abc123xyz; Path=/; HttpOnly
```

### Login Failure
```
REQUEST:
POST /login
Content-Type: application/json

{
    "username": "admin",
    "password": "wrong"
}

RESPONSE: 401 Unauthorized
{
    "error": "Invalid username or password"
}
```

### User Session (Authenticated)
```
REQUEST:
GET /user-session
Cookie: session=abc123xyz

RESPONSE: 200 OK
{
    "id": 1,
    "username": "admin",
    "role": "admin"
}
```

### User Session (Not Authenticated)
```
REQUEST:
GET /user-session
(No session cookie)

RESPONSE: 401 Unauthorized
{
    "error": "Not authenticated"
}
```

### Protected Route (Not Authenticated)
```
REQUEST:
GET /admin
(No session)

RESPONSE: 302 Found
Location: http://localhost:5000/login
```

---

## 🎨 UI Components

### Login Page Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Gradient Background]              │
│            with floating decorations            │
│                                                 │
│            ┌─────────────────────────┐         │
│            │      🍔 FastBite        │         │
│            │  Login Form Card        │         │
│            │                         │         │
│            │ Username: [_________]   │         │
│            │ Password: [_________] 👁 │         │
│            │ ☐ Keep me signed in     │         │
│            │                         │         │
│            │   [Sign In →]           │         │
│            │                         │         │
│            │ ─────────────────────── │         │
│            │   Demo Credentials      │         │
│            │                         │         │
│            │ [Admin]  | [Customer]   │         │
│            │ admin    | guest        │         │
│            │ admin    | guest        │         │
│            │                         │         │
│            └─────────────────────────┘         │
│                                                 │
│         🔒 Your login is secure               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Navbar User Menu
```
Customer View:
┌──────────────────────────────────────┐
│  🍔 FastBite  [🛒]  [👤 guest ▼]    │
│                     ┌───────────────┐│
│                     │ guest ✓       ││
│                     ├───────────────┤│
│                     │ Login         ││
│                     ├───────────────┤│
│                     │ Logout        ││
│                     └───────────────┘│
└──────────────────────────────────────┘

Admin View:
┌──────────────────────────────────────┐
│  📊 Fastbite Admin  [Store]  [👤▼]  │
│                          ┌─────────┐│
│                          │admin ⚙️ ││
│                          │Admin    ││
│                          ├─────────┤│
│                          │ Logout  ││
│                          └─────────┘│
└──────────────────────────────────────┘
```

---

## 🔑 Key Code Snippets

### Login Validation
```python
# Backend
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    # Validate input
    if not username or not password:
        return jsonify({'error': 'Required fields'}), 400
    
    # Query database
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', 
        (username,)
    ).fetchone()
    
    # Verify password
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({
            'success': True,
            'redirect': '/admin' if user['role'] == 'admin' else '/'
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401
```

### Admin Decorator
```python
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        user = get_current_user()
        if not user or user.get('role') != 'admin':
            return redirect(url_for('index'))
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@admin_required
def admin():
    return render_template('admin.html')
```

### Frontend Session Check
```javascript
async function checkUserSession() {
    try {
        const response = await fetch('/user-session');
        if (response.ok) {
            const user = await response.json();
            // User is logged in
            document.getElementById('username-display').textContent = user.username;
            document.getElementById('logout-btn').classList.remove('hidden');
            document.getElementById('login-link').classList.add('hidden');
        } else {
            // User not logged in
            document.getElementById('login-link').classList.remove('hidden');
            document.getElementById('logout-btn').classList.add('hidden');
        }
    } catch (error) {
        console.log('Not authenticated');
    }
}
```

---

## ✅ Testing Checklist

- [ ] Open http://localhost:5000/login
- [ ] Try logging in with `admin/admin`
- [ ] Verify redirect to `/admin`
- [ ] Check user menu shows "admin"
- [ ] Try logging in with `guest/guest`
- [ ] Verify redirect to `/`
- [ ] Check you can NOT access `/admin` as guest
- [ ] Try invalid credentials `admin/wrong`
- [ ] Verify error message appears
- [ ] Click logout button
- [ ] Verify redirect to `/login`
- [ ] Verify session cleared (admin menu hidden)
- [ ] Close browser and reopen
- [ ] Verify session still exists (30-day lifetime)

---

## 🚀 Production Checklist

- [ ] Change `SECRET_KEY` in `app.py`
- [ ] Move config to environment variables
- [ ] Enable HTTPS
- [ ] Set `SESSION_COOKIE_SECURE = True`
- [ ] Set `SESSION_COOKIE_HTTPONLY = True`
- [ ] Use strong password policy
- [ ] Implement rate limiting
- [ ] Add password reset flow
- [ ] Use database password hashing
- [ ] Enable logging
- [ ] Test with real HTTPS certificate

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start app | `python3 app.py` |
| Reset DB | `rm database.db` |
| Check users | `sqlite3 database.db "SELECT * FROM users;"` |
| Restart Flask | Ctrl+C, then `python3 app.py` |
| View errors | Check Flask console output |
| Clear sessions | `rm -rf flask_session/` |

---

*FastBite Authentication System - Visual Reference Guide v1.0*
