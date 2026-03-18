const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db', 'carservice.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT employes_id, first_name, last_name, role, email FROM Employes", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
