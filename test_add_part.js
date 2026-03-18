const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/carservice.db');

const orderId = 21; // Assuming order 21 exists from logs
const masterId = 2; // Assuming master 2 exists
const inventoryId = 10; // Motor oil
const qty = 2;

console.log(`Testing add part: Order ${orderId}, Master ${masterId}, Inv ${inventoryId}, Qty ${qty}`);

db.get("SELECT total_amount FROM Servis_orders WHERE order_id = ?", [orderId], (err, orderBefore) => {
  console.log("Total before:", orderBefore.total_amount);
  
  db.get("SELECT quantity_in_stock FROM Inventory WHERE inventory_id = ?", [inventoryId], (err, invBefore) => {
    console.log("Stock before:", invBefore.quantity_in_stock);
    
    // Simulate the request
    const partPrice = 1200; // Fixed from my nomenclature
    const totalPrice = partPrice * qty;

    db.serialize(() => {
      db.run("UPDATE Inventory SET quantity_in_stock = CAST(quantity_in_stock AS INTEGER) - ? WHERE inventory_id = ?", [qty, inventoryId]);
      
      db.run(
        "INSERT INTO Servis_parts (inventory_id, quantity_parts, total_price, Servis_orders_order_id) VALUES (?, ?, ?, ?)",
        [inventoryId, qty.toString(), totalPrice.toString(), orderId],
        function(err) {
          const servisPartId = this.lastID;
          db.run("INSERT INTO Servis_parts_has_Employes (Servis_parts_Servis_part_id, Employes_employes_id) VALUES (?, ?)", [servisPartId, masterId]);
          db.run("UPDATE Servis_orders SET total_amount = CAST(total_amount AS FLOAT) + ? WHERE order_id = ?", [totalPrice, orderId], () => {
            
            // Check results
            db.get("SELECT total_amount FROM Servis_orders WHERE order_id = ?", [orderId], (err, orderAfter) => {
              console.log("Total after:", orderAfter.total_amount);
              db.get("SELECT quantity_in_stock FROM Inventory WHERE inventory_id = ?", [inventoryId], (err, invAfter) => {
                console.log("Stock after:", invAfter.quantity_in_stock);
                db.all("SELECT * FROM Servis_parts_has_Employes WHERE Servis_parts_Servis_part_id = ?", [servisPartId], (err, links) => {
                  console.log("Links count:", links.length);
                  db.close();
                });
              });
            });
          });
        }
      );
    });
  });
});
