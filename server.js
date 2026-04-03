const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== SETUP ==========
const SECRET_TOKEN = fs.readFileSync(path.join(__dirname, 'token.txt'), 'utf8').trim();

// Fake NoSQL store
const noSqlStore = {
    [SECRET_TOKEN]: {
        flag: "SECURINETS{sqlmap_and_nosql_double_revenge}"
    }
};

// SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        token TEXT
    )`);
    db.run(`INSERT INTO users (id, username, password, token) VALUES 
        (1, 'alice', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'fake_token_123'),
        (2, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '${SECRET_TOKEN}'),
        (3, 'bob', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'fake_token_456')
    `);
    db.run(`CREATE TABLE fake_flags (
        id INTEGER PRIMARY KEY,
        flag TEXT
    )`);
    db.run(`INSERT INTO fake_flags (flag) VALUES 
        ('FLAG{not_here_keep_trying}'),
        ('SECURINETS{fake_flag_lol}'),
        ('CTF{you_wasted_time}')
    `);
    db.run(`CREATE TABLE logs (
        id INTEGER PRIMARY KEY,
        message TEXT
    )`);
    db.run(`INSERT INTO logs (message) VALUES 
        ('User alice logged in'),
        ('Admin access denied for bob'),
        ('SQL injection attempt detected? No.')
    `);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== FANCY HTML/CSS ==========
const FANCY_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Securinets | Secure Support Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', 'Poppins', 'Orbitron', monospace;
            background: linear-gradient(135deg, #0a0f2a 0%, #1a0f2e 100%);
            min-height: 100vh;
            color: #e0e0ff;
            padding: 2rem;
        }

        /* Glassmorphism container */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            backdrop-filter: blur(10px);
            background: rgba(10, 15, 42, 0.6);
            border-radius: 2rem;
            border: 1px solid rgba(100, 80, 200, 0.3);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3), 0 0 20px rgba(80, 60, 200, 0.2);
            overflow: hidden;
            padding: 2rem;
        }

        /* Header with royal gradient */
        .header {
            text-align: center;
            margin-bottom: 3rem;
            position: relative;
        }

        .header h1 {
            font-size: 2.8rem;
            background: linear-gradient(135deg, #4a6eff, #9b4dff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 15px rgba(74, 110, 255, 0.3);
            letter-spacing: 2px;
        }

        .header p {
            color: #b0b0ff;
            margin-top: 0.5rem;
            font-size: 1.1rem;
        }

        .glow {
            position: absolute;
            top: -50%;
            left: -20%;
            width: 140%;
            height: 200%;
            background: radial-gradient(circle, rgba(80,60,200,0.2) 0%, rgba(0,0,0,0) 70%);
            pointer-events: none;
            z-index: -1;
        }

        /* Search card */
        .search-card {
            background: rgba(20, 25, 55, 0.7);
            backdrop-filter: blur(5px);
            border-radius: 1.5rem;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(74, 110, 255, 0.4);
            transition: all 0.3s ease;
        }

        .search-card:hover {
            border-color: #9b4dff;
            box-shadow: 0 0 20px rgba(155, 77, 255, 0.2);
        }

        .input-group {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: flex-end;
        }

        .input-field {
            flex: 2;
            min-width: 200px;
        }

        .input-field label {
            display: block;
            margin-bottom: 0.5rem;
            color: #bfbfff;
            font-weight: 500;
        }

        .input-field input {
            width: 100%;
            padding: 0.9rem 1.2rem;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #4a6eff;
            border-radius: 1rem;
            color: #fff;
            font-size: 1rem;
            transition: all 0.2s;
        }

        .input-field input:focus {
            outline: none;
            border-color: #9b4dff;
            box-shadow: 0 0 10px rgba(155, 77, 255, 0.5);
        }

        button {
            background: linear-gradient(135deg, #4a6eff, #9b4dff);
            border: none;
            padding: 0.9rem 2rem;
            border-radius: 2rem;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            font-size: 1rem;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(74, 110, 255, 0.3);
        }

        /* Ticket list */
        .ticket-list {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 1.5rem;
            padding: 1.5rem;
            margin-top: 1rem;
        }

        .ticket-list h3 {
            color: #9b4dff;
            margin-bottom: 1rem;
            border-left: 4px solid #4a6eff;
            padding-left: 1rem;
        }

        .ticket-list ul {
            list-style: none;
        }

        .ticket-list li {
            padding: 0.7rem;
            border-bottom: 1px solid rgba(74, 110, 255, 0.3);
            font-family: monospace;
        }

        .ticket-list li:last-child {
            border-bottom: none;
        }

        /* Result area */
        .result-area {
            margin-top: 2rem;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 1rem;
            padding: 1.5rem;
            border-left: 4px solid #9b4dff;
        }

        .result-area h3 {
            color: #4a6eff;
            margin-bottom: 0.8rem;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 3rem;
            font-size: 0.8rem;
            color: #6a6a9a;
        }

        /* Responsive */
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .container { padding: 1rem; }
            .header h1 { font-size: 2rem; }
            .input-group { flex-direction: column; }
            button { width: 100%; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="glow"></div>
        <h1>🔐 Securinets Support Portal</h1>
        <p>Enterprise-grade ticket system | Zero trust? More like zero security 😈</p>
    </div>

    <div class="search-card">
        <form method="GET" action="/search" id="searchForm">
            <div class="input-group">
                <div class="input-field">
                    <label>📎 Ticket ID</label>
                    <input type="text" name="id" placeholder="e.g., 1, 2, 3..." autocomplete="off">
                </div>
                <button type="submit">🔍 Search</button>
            </div>
        </form>
    </div>

    <div class="ticket-list">
        <h3>📋 Recent Support Tickets</h3>
        <ul>
            <li>🟡 Ticket #1: Server migration failed – urgent</li>
            <li>🟢 Ticket #2: Password reset request – alice</li>
            <li>🔴 Ticket #3: Flag not found – investigation ongoing</li>
            <li>⚪ Ticket #4: SQL error? No, we don't have SQL injection...</li>
        </ul>
    </div>

    <div id="result" class="result-area" style="display: none;">
        <!-- Dynamic result will appear here -->
    </div>

    <div class="footer">
        <span>Securinets Revenge CTF | Task makers become task takers</span>
    </div>
</div>

<script>
    // If the page loads with a query result, display it nicely
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam) {
        fetch('/search?ajax=1&id=' + encodeURIComponent(idParam))
            .then(res => res.text())
            .then(html => {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<h3>🔎 Search Result</h3>' + html;
                resultDiv.style.display = 'block';
            })
            .catch(err => console.error);
    }
</script>
</body>
</html>
`;

// ========== ROUTES ==========
app.get('/', (req, res) => {
    res.send(FANCY_HTML);
});

// Vulnerable search endpoint (also supports AJAX)
app.get('/search', (req, res) => {
    let id = req.query.id;
    const isAjax = req.query.ajax === '1';
    if (!id) {
        if (isAjax) return res.status(400).send('Missing id');
        return res.redirect('/');
    }
    const query = `SELECT id, message FROM logs WHERE id = ${id}`;
    console.log(`Executing: ${query}`);
    
    db.all(query, (err, rows) => {
        if (err) {
            const errorMsg = `<div style="color:#ff6b6b">Error: ${err.message}</div><a href="/">← Back</a>`;
            if (isAjax) return res.send(errorMsg);
            return res.send(FANCY_HTML.replace('<div id="result" class="result-area" style="display: none;">', `<div id="result" class="result-area">${errorMsg}</div>`));
        }
        if (rows.length === 0) {
            const noResult = `<div>❌ No results found for ID = ${id}</div><a href="/">← Back</a>`;
            if (isAjax) return res.send(noResult);
            return res.send(FANCY_HTML.replace('<div id="result" class="result-area" style="display: none;">', `<div id="result" class="result-area">${noResult}</div>`));
        }
        let html = `<ul style="list-style:none; padding-left:0;">`;
        rows.forEach(row => {
            html += `<li>🎟️ Ticket #${row.id}: ${row.message}</li>`;
        });
        html += `</ul><a href="/">← Back to search</a>`;
        if (isAjax) return res.send(html);
        return res.send(FANCY_HTML.replace('<div id="result" class="result-area" style="display: none;">', `<div id="result" class="result-area">${html}</div>`));
    });
});

// Second layer API endpoint
app.get('/api/admin/flag', (req, res) => {
    const token = req.headers['x-auth-token'] || req.query.token;
    if (!token) {
        return res.status(401).json({ error: 'Missing token. This endpoint requires a valid token from the database.' });
    }
    if (noSqlStore[token]) {
        return res.json({ flag: noSqlStore[token].flag });
    } else {
        return res.status(403).json({ error: 'Invalid token. Did you find the real one?' });
    }
});

app.get('/hint', (req, res) => {
    res.json({ hint: "The token is in the database. But that's not the flag. Use it to unlock the real flag." });
});

app.listen(PORT, () => {
    console.log(`🔥 SQL + NoSQL Revenge challenge running on port ${PORT}`);
    console.log(`💀 Royal blue/purple theme active`);
});
