# FastBite - Quick Start Guide

## 🚀 Getting Started with Authentication

### Prerequisites
```bash
# Python 3.8+ required
python3 --version

# Install dependencies
pip install -r requirements.txt
```

### Running the Application

```bash
# Navigate to project directory
cd /Users/sirichaikhamsukloet/Desktop/Fast\ Food/fastbite-app

# Start Flask server
python3 app.py
```

**Expected Output:**
```
Database initialized successfully
✓ Flask app loaded successfully
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Accessing the Application

Open your browser and navigate to:
- **Store**: http://localhost:5000/
- **Admin**: http://localhost:5000/admin (requires login)
- **Login**: http://localhost:5000/login

---

## 🔐 Test Accounts

### Admin Account
```
Username: admin
Password: admin
Role: Administrator
Access: Full admin dashboard and analytics
```

### Customer Account
```
Username: guest
Password: guest
Role: Customer
Access: Store, orders, and reviews
```

---

## ✅ Testing Scenarios

### Scenario 1: Customer Login & Browse
1. Go to http://localhost:5000/login
2. Enter username: `guest`, password: `guest`
3. Click "Sign In"
4. Verify redirect to home page
5. Check user menu shows "guest"
6. Verify admin link is NOT visible
7. Try accessing http://localhost:5000/admin
8. Should redirect to home page

### Scenario 2: Admin Login & Dashboard
1. Go to http://localhost:5000/login
2. Enter username: `admin`, password: `admin`
3. Click "Sign In"
4. Verify redirect to admin dashboard
5. Check user menu shows "admin"
6. Verify admin link IS visible
7. View dashboard statistics and charts
8. Verify data loads correctly

### Scenario 3: Failed Login
1. Go to http://localhost:5000/login
2. Enter invalid credentials
3. Click "Sign In"
4. Verify error message appears
5. Password field should be cleared
6. Try again with correct credentials

### Scenario 4: Logout
1. After logging in
2. Click user menu dropdown
3. Click "Logout"
4. Verify redirect to login page
5. Try accessing /admin
6. Should redirect to login page

### Scenario 5: Session Persistence
1. Login as admin
2. Close browser tab
3. Open new tab and go to http://localhost:5000/admin
4. Should still be logged in (session persists for 30 days)
5. Check user menu shows correct username

---

## 📊 Database Info

### Database Location
```
/Users/sirichaikhamsukloet/Desktop/Fast Food/fastbite-app/database.db
```

### Check Users
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('database.db')
cursor = conn.cursor()
cursor.execute('SELECT id, username, role FROM users')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, Username: {row[1]}, Role: {row[2]}')
conn.close()
"
```

### Reset Database
```bash
# Remove old database
rm database.db

# Restart app to reinitialize
python3 app.py
```

---

## 🐛 Troubleshooting

### Issue: "Database is locked"
**Solution**: Close other instances of the app and try again

### Issue: "Invalid username or password" on correct credentials
**Solution**: Delete `database.db` and restart the app

### Issue: Admin page shows but no data
**Solution**: 
1. Check browser console for errors
2. Verify `/admin/stats` API returns data
3. Check Flask debug output for errors

### Issue: Session doesn't persist
**Solution**:
1. Clear browser cookies
2. Check Flask session folder exists
3. Verify SECRET_KEY hasn't changed

### Issue: "TypeError: 'NoneType' object is not subscriptable"
**Solution**: Database might not be initialized. Delete `database.db` and restart.

---

## 🔄 API Testing with cURL

### Login Request
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Get User Session
```bash
curl http://localhost:5000/user-session \
  -H "Cookie: session=YOUR_SESSION_ID"
```

### Logout Request
```bash
curl -X POST http://localhost:5000/logout \
  -H "Cookie: session=YOUR_SESSION_ID"
```

### Get Admin Stats
```bash
curl http://localhost:5000/admin/stats \
  -H "Cookie: session=YOUR_SESSION_ID"
```

---

## 📁 Project Structure

```
fastbite-app/
├── app.py                          # Main Flask application
├── schema.sql                       # Database schema
├── database.db                      # SQLite database (auto-created)
├── requirements.txt                 # Python dependencies
│
├── templates/
│   ├── login.html                  # ✨ NEW: Login page
│   ├── index.html                  # Updated: Added user menu
│   └── admin.html                  # Updated: Added user menu
│
├── static/
│   ├── css/
│   │   └── style.css               # Shared styles
│   │
│   ├── js/
│   │   ├── app.js                  # Updated: Session checking
│   │   ├── admin.js                # Updated: Session checking
│   │   └── login.js                # ✨ NEW: Login handler
│   │
│   └── uploads/                    # For future image uploads
│
└── AUTHENTICATION.md               # ✨ NEW: Full documentation
```

---

## 🛠️ Making Changes

### Modify Session Timeout
Edit `app.py`:
```python
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour instead of 30 days
```

### Change Admin Credentials
Edit `schema.sql` and regenerate database:
```python
from werkzeug.security import generate_password_hash
new_hash = generate_password_hash('new_password')
print(new_hash)  # Copy this hash to schema.sql
```

### Add New User
```python
from werkzeug.security import generate_password_hash
import sqlite3

conn = sqlite3.connect('database.db')
hashed = generate_password_hash('password123')
conn.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
             ('newuser', hashed, 'customer'))
conn.commit()
conn.close()
```

---

## 📝 Important Notes

1. **Security**
   - Change SECRET_KEY before production
   - Use HTTPS in production
   - Don't commit credentials to git
   - Store sensitive config in environment variables

2. **Sessions**
   - Stored in `flask_session/` folder
   - Sessions persist across server restarts
   - Clear folder to reset all sessions: `rm -rf flask_session/`

3. **Database**
   - First run creates `database.db` from `schema.sql`
   - Delete database to reset to initial state
   - SQLite is suitable for development/small deployments

4. **Frontend**
   - Login redirects are handled in JavaScript
   - Session info loaded on page init
   - User menu updates based on role

---

## 🎓 Next Steps

1. ✅ **Authentication Complete** - Basic login/logout working
2. ⏭️ **Product CRUD** - Add/Edit/Delete functionality
3. ⏭️ **Image Upload** - Product image management
4. ⏭️ **Search** - Product search feature
5. ⏭️ **Real-time Dashboard** - WebSocket updates

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Start app | `python3 app.py` |
| Reset database | `rm database.db` |
| Check users | `sqlite3 database.db "SELECT * FROM users;"` |
| Install deps | `pip install -r requirements.txt` |
| Test login | Visit `http://localhost:5000/login` |
| View admin | Visit `http://localhost:5000/admin` (after login) |

---

*Last Updated: May 9, 2026*  
*FastBite v1.0 - Authentication System Ready*
