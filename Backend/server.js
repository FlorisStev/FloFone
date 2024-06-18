// Import required modules
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const path = require('path'); // Module to handle file and directory paths
const sqlite3 = require('sqlite3').verbose(); // SQLite3 database driver
const jwt = require('jsonwebtoken'); // JSON Web Token for authentication
const bcrypt = require('bcryptjs'); // Library to hash passwords

const app = express(); // Initialize Express app
const port = 3000; // Define the port to run the server
const SECRET_KEY = '69420'; // Secret key for JWT
// ========================
// Database Setup
// ========================
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message); // Log error if database connection fails
    }
    console.log('Connected to the database.');

    // Create 'users' table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        isAdmin BOOLEAN NOT NULL DEFAULT 0
    )`);

    // Create 'products' table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        image TEXT
    )`);

    // Create 'orders' table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        orderDate TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postcode TEXT NOT NULL,
        country TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);

    // Create 'order_items' table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        orderId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    // Create 'cart' table if it does not exist
    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (productId) REFERENCES products(id)
    )`);
});

// ========================
// Middleware Setup
// ========================
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, './'))); // Serve static files

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                console.error('JWT verification failed:', err);
                return res.status(403).json({ error: 'Token expired' });
            }
            req.user = user; // Attach user info to request object
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        res.sendStatus(401); // Unauthorized if no token is provided
    }
};

// Middleware to check if the user is an admin
const checkAdmin = (req, res, next) => {
    const userId = req.user.id;
    db.get(`SELECT isAdmin FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.isAdmin) {
            next(); // Proceed if the user is an admin
        } else {
            res.status(403).json({ error: 'Access denied. Admins only.' });
        }
    });
};

// Middleware to check if the user is trying to modify their own admin status
const checkSelfModification = (req, res, next) => {
    const userId = req.user.id;
    const targetUserId = parseInt(req.params.id);
    if (userId === targetUserId) {
        return res.status(403).json({ error: 'You cannot modify your own admin status.' });
    }
    next(); // Proceed if the user is not modifying their own admin status
};

// ========================
// User Endpoints
// ========================

// User registration endpoint
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8); // Hash the password
    db.run(`INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)`, 
        [name, email, hashedPassword, false], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully!' });
        }
    );
});

// User login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Endpoint to get the logged-in user's info
app.get('/api/user', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(user);
    });
});

// Endpoint to get a user's details and their orders
app.get('/api/user/:id', authenticateJWT, checkAdmin, (req, res) => {
    const userId = req.params.id;
    db.get(`SELECT id, name, email, isAdmin FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        db.all(`SELECT orders.id, GROUP_CONCAT(products.name) AS productNames, orders.orderDate
                FROM orders
                JOIN order_items ON orders.id = order_items.orderId
                JOIN products ON order_items.productId = products.id
                WHERE orders.userId = ?
                GROUP BY orders.id, orders.orderDate`, [userId], (err, orders) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            user.orders = orders;
            res.json(user);
        });
    });
});

// Endpoint to update a user's admin status
app.patch('/api/user/:id/admin', authenticateJWT, checkAdmin, checkSelfModification, (req, res) => {
    const userId = req.params.id;
    const { isAdmin } = req.body;
    db.run(`UPDATE users SET isAdmin = ? WHERE id = ?`, [isAdmin, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(204).send();
    });
});

// Endpoint to get all users
app.get('/api/users', authenticateJWT, checkAdmin, (req, res) => {
    db.all(`SELECT id, name, email, isAdmin FROM users`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Protecting the dashboard route
app.get('/api/dashboard', authenticateJWT, checkAdmin, (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard!' });
});

// ========================
// Product Endpoints
// ========================

// Endpoint to get all products with optional category filter
app.get('/api/products', (req, res) => {
    const category = req.query.category || '';
    let query = 'SELECT * FROM products';
    let params = [];
    if (category) {
        query += ' WHERE category = ?';
        params.push(category);
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ========================
// Cart Endpoints
// ========================

// Endpoint to add product to cart
app.post('/api/cart', authenticateJWT, (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    db.get('SELECT * FROM cart WHERE userId = ? AND productId = ?', [userId, productId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            db.run('UPDATE cart SET quantity = quantity + 1 WHERE userId = ? AND productId = ?', [userId, productId], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(200).json({ message: 'Product quantity updated in cart.' });
            });
        } else {
            db.run('INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)', [userId, productId, 1], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Product added to cart.' });
            });
        }
    });
});

// Endpoint to get all cart items for the authenticated user
app.get('/api/cart', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT cart.id, cart.quantity, products.name, products.price, products.image 
        FROM cart
        JOIN products ON cart.productId = products.id
        WHERE cart.userId = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Endpoint to delete a product from the cart
app.delete('/api/cart/:id', authenticateJWT, (req, res) => {
    const cartId = req.params.id;
    const userId = req.user.id;
    db.run('DELETE FROM cart WHERE id = ? AND userId = ?', [cartId, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }
        res.status(200).json({ message: 'Product removed from cart' });
    });
});

// ========================
// Order Endpoints
// ========================

// Endpoint to submit a new order
app.post('/api/orders', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const orderDate = new Date().toISOString();
    const { address, city, state, postcode, country } = req.body;
    db.run(`INSERT INTO orders (userId, orderDate, address, city, state, postcode, country) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [userId, orderDate, address, city, state, postcode, country], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const orderId = this.lastID;
            db.all(`SELECT * FROM cart WHERE userId = ?`, [userId], (err, cartItems) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const insertStmt = db.prepare(`INSERT INTO order_items (orderId, productId, quantity) VALUES (?, ?, ?)`);
                cartItems.forEach(item => {
                    insertStmt.run(orderId, item.productId, item.quantity);
                });
                insertStmt.finalize((err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    db.run(`DELETE FROM cart WHERE userId = ?`, [userId], (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ message: 'Order placed successfully', orderId: orderId });
                    });
                });
            });
        });
});

// Endpoint to get all orders with detailed information for the dashboard
app.get('/api/orders', authenticateJWT, checkAdmin, (req, res) => {
    const query = `
        SELECT orders.id AS orderId, users.name AS customerName, users.email AS customerEmail, 
        GROUP_CONCAT(products.name) AS productNames, 
        SUM(products.price * order_items.quantity) AS totalAmount, 
        orders.orderDate
        FROM orders
        JOIN users ON orders.userId = users.id
        JOIN order_items ON orders.id = order_items.orderId
        JOIN products ON order_items.productId = products.id
        GROUP BY orders.id, users.name, users.email, orders.orderDate
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Common function to fetch order details including products
function fetchOrderDetails(orderId, callback) {
    const query = `
        SELECT orders.id AS orderId, users.name AS customerName, users.email AS customerEmail, 
        orders.orderDate, orders.address, orders.city, orders.state, orders.postcode, orders.country
        FROM orders
        JOIN users ON orders.userId = users.id
        WHERE orders.id = ?
    `;
    db.get(query, [orderId], (err, order) => {
        if (err) {
            return callback(err);
        }
        if (!order) {
            return callback(new Error('Order not found'));
        }
        const productsQuery = `
            SELECT products.name, products.price, order_items.quantity
            FROM order_items
            JOIN products ON order_items.productId = products.id
            WHERE order_items.orderId = ?
        `;
        db.all(productsQuery, [orderId], (err, products) => {
            if (err) {
                return callback(err);
            }
            order.products = products;
            callback(null, order);
        });
    });
}

// Endpoint to get details of a specific order
app.get('/api/order/:orderId', authenticateJWT, checkAdmin, (req, res) => {
    const orderId = req.params.orderId;
    fetchOrderDetails(orderId, (err, order) => {
        if (err) {
            if (err.message === 'Order not found') {
                return res.status(404).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json(order);
    });
});

// Endpoint to get all orders for a specific user
app.get('/api/user/:userId/orders', authenticateJWT, checkAdmin, (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT orders.id AS orderId
        FROM orders
        WHERE orders.userId = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const orderDetailsPromises = rows.map(row => {
            return new Promise((resolve, reject) => {
                fetchOrderDetails(row.orderId, (err, order) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(order);
                });
            });
        });
        Promise.all(orderDetailsPromises)
            .then(orders => res.json(orders))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

// Endpoint to update an order
app.put('/api/order/:orderId', authenticateJWT, checkAdmin, (req, res) => {
    const orderId = req.params.orderId;
    const { address, city, state, postcode, country, products } = req.body;
    db.serialize(() => {
        db.run(`UPDATE orders SET 
                address = ?, city = ?, state = ?, postcode = ?, country = ?
                WHERE id = ?`, [address, city, state, postcode, country, orderId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            db.run(`DELETE FROM order_items WHERE orderId = ?`, [orderId], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const insertStmt = db.prepare(`INSERT INTO order_items (orderId, productId, quantity) VALUES (?, ?, ?)`);
                let completed = 0;
                let errors = false;
                products.forEach(product => {
                    db.get(`SELECT id FROM products WHERE name = ?`, [product.name], (err, row) => {
                        if (err) {
                            errors = true;
                            return res.status(500).json({ error: err.message });
                        }
                        if (row) {
                            insertStmt.run(orderId, row.id, product.quantity, (err) => {
                                if (err) {
                                    errors = true;
                                    return res.status(500).json({ error: err.message });
                                }
                                completed++;
                                if (completed === products.length && !errors) {
                                    insertStmt.finalize((err) => {
                                        if (err) {
                                            return res.status(500).json({ error: err.message });
                                        }
                                        res.json({ message: 'Order updated successfully' });
                                    });
                                }
                            });
                        } else {
                            errors = true;
                            return res.status(500).json({ error: `Product not found: ${product.name}` });
                        }
                    });
                });
            });
        });
    });
});

// Endpoint to delete an order
app.delete('/api/order/:orderId', authenticateJWT, checkAdmin, (req, res) => {
    const orderId = req.params.orderId;
    db.run(`DELETE FROM orders WHERE id = ?`, [orderId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.run(`DELETE FROM order_items WHERE orderId = ?`, [orderId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Order deleted successfully' });
        });
    });
});

// ========================
// Token Management
// ========================

// Token refresh endpoint
app.post('/api/refresh-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ error: 'Token is required' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        const newToken = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token: newToken });
    });
});

// ========================
// Start the Server
// ========================

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
