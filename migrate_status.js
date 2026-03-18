const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.run("UPDATE Servis_orders SET order_status = 'В обработке' WHERE order_status = 'active'", function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Updated ${this.changes} rows from 'active' to 'В обработке'`);
    }
  });
});

db.close();
