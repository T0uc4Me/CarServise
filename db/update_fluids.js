const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
        process.exit(1);
    }
    console.log("Connected to the SQLite database for fluid migration.");

    db.serialize(() => {
        // Update/Rename and set prices for fluids
        const fluidUpdates = [
            { name: 'Антифриз', newName: 'Антифриз', type: 'Жидкости', price: '500' },
            { name: 'Омывающая жидкость', newName: 'Омывайка', type: 'Жидкости', price: '80' },
            { name: 'Заправка кондиционера', newName: 'Заправка кондиционера', type: 'Жидкости', price: '2500' }
        ];

        fluidUpdates.forEach(f => {
            db.run("UPDATE Servises SET servis_name = ?, servis_type = ?, servis_price = ? WHERE servis_name = ?", 
                [f.newName, f.type, f.price, f.name], function(err) {
                if (err) console.error(`Error updating ${f.name}:`, err.message);
                else if (this.changes > 0) console.log(`Updated fluid: ${f.name} -> ${f.newName} (${f.price} ₽)`);
                else {
                    // If doesn't exist, insert
                    db.run("INSERT INTO Servises (servis_name, servis_type, servis_price) VALUES (?, ?, ?)",
                        [f.newName, f.type, f.price], (err) => {
                            if (err) console.error(`Error inserting ${f.newName}:`, err.message);
                            else console.log(`Inserted fluid: ${f.newName} (${f.price} ₽)`);
                        }
                    );
                }
            });
        });

        console.log("Fluid migration script finished processing.");
    });

    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Closed the database connection.');
    });
});
