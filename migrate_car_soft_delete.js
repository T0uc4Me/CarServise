const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db', 'carservice.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE Car ADD COLUMN is_deleted INTEGER DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column is_deleted already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Column is_deleted added successfully.");
        }
        db.close();
    });
});
