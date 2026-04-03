const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ========== SETUP ==========
// Read the secret token from a file (non-SQL storage)
const SECRET_TOKEN = fs
  .readFileSync(path.join(__dirname, "token.txt"), "utf8")
  .trim();

// Fake "NoSQL" store – just an object for demo (could be Redis/Mongo)
const noSqlStore = {
  [SECRET_TOKEN]: {
    flag: "SECURINETS{sqlmap_and_nosql_double_revenge}",
  },
};

// SQLite database with red herrings
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  // Real user table
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

  // Red herring table 1: fake flags
  db.run(`CREATE TABLE fake_flags (
        id INTEGER PRIMARY KEY,
        flag TEXT
    )`);
  db.run(`INSERT INTO fake_flags (flag) VALUES 
        ('FLAG{not_here_keep_trying}'),
        ('SECURINETS{fake_flag_lol}'),
        ('CTF{you_wasted_time}')
    `);

  // Red herring table 2: logs
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

// ========== ROUTES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main page with search form (vulnerable to SQLi)
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Securinets Support Portal</title>
            <style>
                body { font-family: monospace; background: #0a0a0a; color: #0f0; padding: 40px; }
                input, button { background: #1a1a1a; border: 1px solid #0f0; color: #0f0; padding: 8px; }
                .result { background: #1a1a1a; padding: 20px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>🔍 Securinets Support Ticket Search</h1>
            <p>Search for ticket ID (e.g., 1)</p>
            <form method="GET" action="/search">
                <input type="text" name="id" placeholder="Enter ticket ID">
                <button type="submit">Search</button>
            </form>
            <div class="result">
                <h3>Recent Tickets</h3>
                <ul>
                    <li>Ticket #1: Server down</li>
                    <li>Ticket #2: Password reset</li>
                    <li>Ticket #3: Flag not found</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

// Vulnerable endpoint: SQL injection via id parameter
app.get("/search", (req, res) => {
  let id = req.query.id;
  if (!id) {
    return res.redirect("/");
  }
  // 🚨 VULNERABLE: direct concatenation
  const query = `SELECT id, message FROM logs WHERE id = ${id}`;
  console.log(`Executing: ${query}`);

  db.all(query, (err, rows) => {
    if (err) {
      return res.send(`<h3>Error: ${err.message}</h3><a href="/">Back</a>`);
    }
    if (rows.length === 0) {
      return res.send(`<h3>No results found.</h3><a href="/">Back</a>`);
    }
    let html = `<h3>Search results for ID = ${id}</h3><ul>`;
    rows.forEach((row) => {
      html += `<li>Ticket #${row.id}: ${row.message}</li>`;
    });
    html += `</ul><a href="/">Back</a>`;
    res.send(html);
  });
});

// Second layer endpoint: requires valid token (non-SQL check)
app.get("/api/admin/flag", (req, res) => {
  const token = req.headers["x-auth-token"] || req.query.token;
  if (!token) {
    return res
      .status(401)
      .json({
        error:
          "Missing token. This endpoint requires a valid token from the database.",
      });
  }
  if (noSqlStore[token]) {
    return res.json({ flag: noSqlStore[token].flag });
  } else {
    return res
      .status(403)
      .json({ error: "Invalid token. Did you find the real one?" });
  }
});

// Hidden hint endpoint (optional, can be removed for harder challenge)
app.get("/hint", (req, res) => {
  res.json({
    hint: "The token is in the database. But that's not the flag. Use it to unlock the real flag.",
  });
});

app.listen(PORT, () => {
  console.log(`🔥 SQL + NoSQL Revenge challenge running on port ${PORT}`);
  console.log(`💀 The token is stored in token.txt (non-SQL). Good luck.`);
});
