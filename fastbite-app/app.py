from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3
import os
from functools import wraps

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'database.db')

# Session Configuration
app.config['SECRET_KEY'] = 'fastbite-secret-key-2024'  # Change in production
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 2592000  # 30 days
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

def init_db():
    """Initialize database from schema.sql"""
    if os.path.exists(DB_FILE):
        return
    
    conn = sqlite3.connect(DB_FILE)
    with open(os.path.join(BASE_DIR, 'schema.sql'), 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database initialized successfully")

# Initialize Database
init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================
# AUTHENTICATION HELPERS & DECORATORS
# ============================================

def get_current_user():
    """Get current logged-in user from session"""
    if 'user_id' in session:
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        conn.close()
        return dict(user) if user else None
    return None

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        user = get_current_user()
        if not user or user.get('role') != 'admin':
            return redirect(url_for('index'))
        
        return f(*args, **kwargs)
    return decorated_function

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    if request.method == 'POST':
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Validate input
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        # Verify credentials
        if user and check_password_hash(user['password'], password):
            session.permanent = True
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'redirect': '/admin' if user['role'] == 'admin' else '/'
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    
    # GET request - show login page
    if 'user_id' in session:
        redirect_url = '/admin' if session.get('role') == 'admin' else '/'
        return redirect(redirect_url)
    
    return render_template('login.html')

@app.route('/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/user-session', methods=['GET'])
def get_user_session():
    """Get current user session info"""
    user = get_current_user()
    if user:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'role': user['role']
        }), 200
    return jsonify({'error': 'Not authenticated'}), 401

# ============================================
# FRONTEND ROUTES
# ============================================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
@admin_required
def admin():
    return render_template('admin.html')

# API Endpoints
@app.route('/menu', methods=['GET'])
def get_menu():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    
    # Optionally append review stats to products list for nicer display
    menu = []
    for p in products:
        p_dict = dict(p)
        stats = conn.execute('SELECT COUNT(id) as count, AVG(rating) as avg_rating FROM reviews WHERE product_id = ?', (p['id'],)).fetchone()
        p_dict['review_count'] = stats['count'] if stats['count'] else 0
        p_dict['avg_rating'] = round(stats['avg_rating'], 1) if stats['avg_rating'] else 0
        menu.append(p_dict)
        
    conn.close()
    return jsonify(menu)

@app.route('/order', methods=['POST'])
def create_order():
    data = request.json
    cart = data.get('cart', [])
    total_price = data.get('total_price', 0)
    
    # Get user_id from session, default to guest (id=2) if not logged in
    user_id = session.get('user_id', 2)

    if not cart:
        return jsonify({'error': 'Cart is empty'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO orders (user_id, total_price) VALUES (?, ?)', (user_id, total_price))
    order_id = cursor.lastrowid

    for item in cart:
        cursor.execute(
            'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
            (order_id, item['id'], item['quantity'])
        )

    conn.commit()
    conn.close()
    return jsonify({'message': 'Order placed successfully', 'order_id': order_id}), 201

@app.route('/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(o) for o in orders])

@app.route('/reviews/<int:menu_id>', methods=['GET'])
def get_reviews(menu_id):
    conn = get_db_connection()
    reviews = conn.execute('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', (menu_id,)).fetchall()
    
    # Calculate stats
    stats = conn.execute('SELECT COUNT(id) as count, AVG(rating) as avg_rating FROM reviews WHERE product_id = ?', (menu_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'reviews': [dict(r) for r in reviews],
        'stats': dict(stats)
    })

@app.route('/reviews', methods=['POST'])
def add_review():
    data = request.json
    product_id = data.get('product_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not all([product_id, rating]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO reviews (product_id, rating, comment) VALUES (?, ?, ?)', (product_id, rating, comment))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Review added successfully'}), 201

# Admin APIs
@app.route('/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    conn = get_db_connection()
    total_orders = conn.execute('SELECT COUNT(id) as total FROM orders').fetchone()['total']
    total_revenue = conn.execute('SELECT SUM(total_price) as revenue FROM orders').fetchone()['revenue'] or 0
    top_menu = conn.execute('''
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 1
    ''').fetchone()
    
    conn.close()
    return jsonify({
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'top_menu': dict(top_menu) if top_menu else None
    })

@app.route('/admin/top-products', methods=['GET'])
@admin_required
def get_top_products():
    conn = get_db_connection()
    products = conn.execute('''
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 5
    ''').fetchall()
    conn.close()
    return jsonify([dict(p) for p in products])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
