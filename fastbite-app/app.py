from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Frontend Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
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
    user_id = data.get('user_id', 2) # Default to guest user (id=2)

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
