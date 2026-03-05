const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
        process.exit(1);
    }
    console.log("Connected to the SQLite database for migration.");

    db.serialize(() => {
        // 1. Remove deprecated services
        const servicesToRemove = ['Замена масла', 'Регулировка развал-схождения'];
        servicesToRemove.forEach(name => {
            db.run("DELETE FROM Servises WHERE servis_name = ?", [name], function(err) {
                if (err) console.error(`Error deleting ${name}:`, err.message);
                else if (this.changes > 0) console.log(`Deleted service: ${name}`);
            });
        });

        // 2. Add new services with appropriate categories
        const newServices = [
            { name: 'Ремонт ключа зажигания', type: 'Ремонт', price: '1200' },
            { name: 'Замена фильтров', type: 'ТО', price: '800' },
            { name: 'Замена свечей', type: 'ТО', price: '1500' },
            { name: 'Детейлинг салона', type: 'Обслуживание', price: '5000' },
            { name: 'Замена аккумулятора', type: 'Ремонт', price: '500' },
            { name: 'Компьютерная диагностика', type: 'Диагностика', price: '1500' },
            { name: 'Антифриз', type: 'Дорожная помощь', price: '450' },
            { name: 'Омывающая жидкость', type: 'Дорожная помощь', price: '300' }
        ];

        newServices.forEach(s => {
            db.run("INSERT INTO Servises (servis_name, servis_type, servis_price) VALUES (?, ?, ?)", 
                [s.name, s.type, s.price], function(err) {
                if (err) console.error(`Error adding ${s.name}:`, err.message);
                else console.log(`Added service: ${s.name}`);
            });
        });

        // 3. Update existing services to new categories if needed
        db.run("UPDATE Servises SET servis_type = 'Дорожная помощь' WHERE servis_name = 'Заправка кондиционера'", function(err) {
            if (err) console.error("Error updating Заправка кондиционера:", err.message);
            else if (this.changes > 0) console.log("Updated category for Заправка кондиционера");
        });

        console.log("Migration script finished processing commands.");
    });

    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Closed the database connection.');
    });
});
