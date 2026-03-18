const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/carservice.db');

const orderId = 21;
const masterId = 2;
const parts = [
  { inventory_id: 11, quantity: 1 }, // Brake pads
  { inventory_id: 12, quantity: 1 }  // Air filter
];

console.log(`Testing BATCH add: Order ${orderId}, Master ${masterId}, Parts:`, parts);

db.get("SELECT total_amount FROM Servis_orders WHERE order_id = ?", [orderId], (err, orderBefore) => {
  console.log("Total before:", orderBefore.total_amount);
  
  db.serialize(() => {
    let totalIncrease = 0;
    let completed = 0;

    parts.forEach(p => {
      db.get("SELECT * FROM Inventory WHERE inventory_id = ?", [p.inventory_id], (err, part) => {
        const itemTotal = parseFloat(part.inventory_price) * p.quantity;
        totalIncrease += itemTotal;

        db.run("UPDATE Inventory SET quantity_in_stock = CAST(quantity_in_stock AS INTEGER) - ? WHERE inventory_id = ?", [p.quantity, p.inventory_id]);
        
        db.run(
          "INSERT INTO Servis_parts (inventory_id, quantity_parts, total_price, Servis_orders_order_id) VALUES (?, ?, ?, ?)",
          [p.inventory_id, p.quantity.toString(), itemTotal.toString(), orderId],
          function(err) {
            const spId = this.lastID;
            db.run("INSERT INTO Servis_parts_has_Employes (Servis_parts_Servis_part_id, Employes_employes_id) VALUES (?, ?)", [spId, masterId], () => {
              completed++;
              if (completed === parts.length) {
                db.run("UPDATE Servis_orders SET total_amount = CAST(total_amount AS FLOAT) + ? WHERE order_id = ?", [totalIncrease, orderId], () => {
                  db.get("SELECT total_amount FROM Servis_orders WHERE order_id = ?", [orderId], (err, orderAfter) => {
                    console.log("Total after:", orderAfter.total_amount);
                    console.log("Success! Batch processed.");
                    db.close();
                  });
                });
              }
            });
          }
        );
      });
    });
  });
});
