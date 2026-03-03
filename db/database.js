const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        // Гарантируем существование таблицы чата при каждом старте
        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            sender TEXT NOT NULL CHECK(sender IN ('user','admin')),
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT (datetime('now','localtime')),
            is_read INTEGER DEFAULT 0
        )`, (e) => {
            if (e) console.error("chat_messages table error:", e.message);
            else console.log("chat_messages table ready.");
        });
    }
});

module.exports = db;
