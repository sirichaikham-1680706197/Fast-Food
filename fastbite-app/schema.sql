DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_price REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- Insert dummy users
INSERT INTO users (username, password) VALUES ('admin', 'admin');
INSERT INTO users (username, password) VALUES ('guest', 'guest');

-- Insert dummy products
INSERT INTO products (name, price, category, image) VALUES 
('คลาสสิก ชีสเบอร์เกอร์', 119, 'burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400&h=300'),
('ดับเบิ้ลเบคอน เบอร์เกอร์', 159, 'burger', 'https://images.unsplash.com/photo-1594212260654-e0cf58f8b898?auto=format&fit=crop&q=80&w=400&h=300'),
('ไก่ทอดสไปซี่ เบอร์เกอร์', 109, 'burger', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&q=80&w=400&h=300'),
('เบอร์เกอร์เนื้อย่างถ่าน', 189, 'burger', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=400&h=300'),
('พิซซ่าดับเบิ้ลเบอร์เกอร์', 129, 'burger', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400&h=300'),
('บาร์บีคิวเนื้อพรีเมียม', 199, 'burger', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=400&h=300'),
('เฟรนช์ฟรายส์ชีสลาวา', 89, 'snack', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=400&h=300'),
('นักเก็ตไก่ (10 ชิ้น)', 95, 'snack', 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400&h=300'),
('ปีกไก่ทอดซอสเกาหลี', 149, 'snack', 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?auto=format&fit=crop&q=80&w=400&h=300'),
('ชีสบอลทอด', 79, 'snack', 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=400&h=300'),
('โค้กออริจินัล', 30, 'drink', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400&h=300'),
('ชามะนาวเย็น', 45, 'drink', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400&h=300'),
('สเต็กเนื้อริบอาย', 359, 'steak', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400&h=300'),
('พอร์คชอปสเต็ก', 219, 'steak', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&q=80&w=400&h=300'),
('สปาเก็ตตี้คาโบนาร่า', 149, 'spaghetti', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=400&h=300'),
('สปาเก็ตตี้ขี้เมาทะเล', 179, 'spaghetti', 'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?auto=format&fit=crop&q=80&w=400&h=300');

-- Insert dummy reviews
INSERT INTO reviews (product_id, rating, comment) VALUES
(1, 5, 'อร่อยมากครับ เนื้อนุ่มกำลังดี'),
(1, 4, 'รสชาติดีครับ แต่แอบแพงไปนิด'),
(7, 5, 'กรอบอร่อยมาก ชีสเยิ้มๆ ฟินสุดๆ');
