const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_for_testing';

app.use(cors());
app.use(express.json());

// Serve static files from root
app.use(express.static(path.join(__dirname, '../')));

// === Middleware to Verify JWT ===
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// === AUTH ROUTES ===
app.post('/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, username });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

app.get('/api/users', authenticateToken, (req, res) => {
    db.all('SELECT id, username FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// === PROJECTS ROUTES ===
app.get('/api/projects', authenticateToken, (req, res) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/projects', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    db.run('INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)', 
        [title, description, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, title, description, owner_id: req.user.id });
        }
    );
});

// === TASKS ROUTES ===
app.get('/api/projects/:id/tasks', authenticateToken, (req, res) => {
    db.all('SELECT tasks.*, users.username as assignee_name FROM tasks LEFT JOIN users ON tasks.assignee_id = users.id WHERE project_id = ?', 
        [req.params.id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.post('/api/projects/:id/tasks', authenticateToken, (req, res) => {
    const { title, description, status, assignee_id } = req.body;
    const taskStatus = status || 'todo';
    
    db.run('INSERT INTO tasks (project_id, title, description, status, assignee_id) VALUES (?, ?, ?, ?, ?)', 
        [req.params.id, title, description, taskStatus, assignee_id || null], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, title, status: taskStatus, assignee_id });
        }
    );
});

app.put('/api/tasks/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Task updated successfully' });
    });
});

// === COMMENTS ROUTES ===
app.get('/api/tasks/:id/comments', authenticateToken, (req, res) => {
    db.all('SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE task_id = ? ORDER BY created_at ASC', 
        [req.params.id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.post('/api/tasks/:id/comments', authenticateToken, (req, res) => {
    const { content } = req.body;
    db.run('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', 
        [req.params.id, req.user.id, content], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, content, user_id: req.user.id });
        }
    );
});

app.use((req, res) => {
    // Only serve index.html for GET requests that accept HTML
    if (req.method === 'GET' && req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../index.html'));
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
