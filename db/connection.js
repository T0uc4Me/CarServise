const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database for application use.");
    }
});

// Custom query method to handle SQLite callbacks consistently
db.query = function(sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }

    const stmt = this.prepare(sql, (err) => {
        if (err) {
            return callback(err);
        }

        if (sql.toLowerCase().startsWith('select')) {
            stmt.all(params, (err, rows) => {
                stmt.finalize();
                if (err) {
                    return callback(err);
                }
                callback(null, rows);
            });
        } else {
            stmt.run(params, function(err) {
                stmt.finalize();
                if (err) {
                    return callback(err);
                }
                callback(null, { affectedRows: this.changes, insertId: this.lastID });
            });
        }
    });
};

// Promisify db.query for async/await usage
db.promise = () => ({
    query: (sql, params) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    return reject(err);
                }
                // For SELECT queries, return rows directly. For others, return results object.
                if (sql.toLowerCase().startsWith('select')) {
                    resolve([results]); // Wrap results in an array to match mysql2's [rows, fields] format
                } else {
                    resolve(results);
                }
            });
        });
    },
});

module.exports = db;
