const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        db.serialize(() => {
            // Drop tables if they exist (for development purposes)
            db.run("DROP TABLE IF EXISTS Payments");
            db.run("DROP TABLE IF EXISTS Servis_order_details");
            db.run("DROP TABLE IF EXISTS Employ_work_log");
            db.run("DROP TABLE IF EXISTS Servis_parts_has_Employes");
            db.run("DROP TABLE IF EXISTS Servis_parts");
            db.run("DROP TABLE IF EXISTS Servis_orders");
            db.run("DROP TABLE IF EXISTS Car");
            db.run("DROP TABLE IF EXISTS Fuel_Types_has_Servises");
            db.run("DROP TABLE IF EXISTS Servises");
            db.run("DROP TABLE IF EXISTS Fuel_Types");
            db.run("DROP TABLE IF EXISTS Inventory");
            db.run("DROP TABLE IF EXISTS Employes");
            db.run("DROP TABLE IF EXISTS Customers");

            // Create Customers table
            db.run(`CREATE TABLE IF NOT EXISTS Customers (
                customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name VARCHAR(45),
                last_name VARCHAR(45),
                email VARCHAR(45) UNIQUE,
                phone VARCHAR(45),
                address VARCHAR(45),
                data_registrat DATE,
                total_cost VARCHAR(45),
                password VARCHAR(255) -- Добавляем поле для пароля
            )`);

            // Create Employes table
            db.run(`CREATE TABLE IF NOT EXISTS Employes (
                employes_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name VARCHAR(45),
                last_name VARCHAR(45),
                phone VARCHAR(45),
                email VARCHAR(45) UNIQUE,
                role VARCHAR(45),
                hire_date DATE,
                salary VARCHAR(45),
                status VARCHAR(45),
                password VARCHAR(255)
            )`);

            // Create Car table
            db.run(`CREATE TABLE IF NOT EXISTS Car (
                car_id INTEGER PRIMARY KEY AUTOINCREMENT,
                mark VARCHAR(45),
                model VARCHAR(45),
                year DATE,
                gos_nomer VARCHAR(45),
                wincode VARCHAR(45),
                Customers_customer_id INT,
                FOREIGN KEY (Customers_customer_id) REFERENCES Customers(customer_id)
            )`);

            // Create Fuel_Types table
            db.run(`CREATE TABLE IF NOT EXISTS Fuel_Types (
                fuel_id INTEGER PRIMARY KEY AUTOINCREMENT,
                fuel_name VARCHAR(45),
                fuel_price VARCHAR(45)
            )`);

            // Create Servises table
            db.run(`CREATE TABLE IF NOT EXISTS Servises (
                servis_id INTEGER PRIMARY KEY AUTOINCREMENT,
                servis_name VARCHAR(45),
                servis_type VARCHAR(45),
                servis_price VARCHAR(45)
            )`);

            // Create Inventory table
            db.run(`CREATE TABLE IF NOT EXISTS Inventory (
                inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
                inventory_name VARCHAR(45),
                inventory_discription VARCHAR(45),
                quantity_in_stock VARCHAR(45),
                inventory_price VARCHAR(45),
                Employes_employes_id INT,
                FOREIGN KEY (Employes_employes_id) REFERENCES Employes(employes_id)
            )`);

            // Create Servis_parts table
            db.run(`CREATE TABLE IF NOT EXISTS Servis_parts (
                servis_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
                inventory_id INT,
                quantity_parts VARCHAR(45),
                total_price VARCHAR(45),
                Servis_orders_order_id INT,
                FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id),
                FOREIGN KEY (Servis_orders_order_id) REFERENCES Servis_orders(order_id)
            )`);

            // Create Servis_orders table
            db.run(`CREATE TABLE IF NOT EXISTS Servis_orders (
                order_id INTEGER PRIMARY KEY AUTOINCREMENT,
                servis_data VARCHAR(45),
                total_amount VARCHAR(45),
                order_status VARCHAR(45),
                address VARCHAR(255), -- Добавляем столбец для адреса
                Car_car_id INT,
                Customers_customer_id INT,
                Employes_employes_id INT,
                FOREIGN KEY (Car_car_id) REFERENCES Car(car_id),
                FOREIGN KEY (Customers_customer_id) REFERENCES Customers(customer_id),
                FOREIGN KEY (Employes_employes_id) REFERENCES Employes(employes_id)
            )`);

            // Add foreign key to Servis_parts
            db.run(`CREATE TABLE IF NOT EXISTS Servis_parts_temp (
                servis_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
                inventory_id INT,
                quantity_parts VARCHAR(45),
                total_price VARCHAR(45),
                Servis_orders_order_id INT,
                FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id),
                FOREIGN KEY (Servis_orders_order_id) REFERENCES Servis_orders(order_id)
            )`);
            db.run("INSERT INTO Servis_parts_temp SELECT * FROM Servis_parts");
            db.run("DROP TABLE Servis_parts");
            db.run("ALTER TABLE Servis_parts_temp RENAME TO Servis_parts");


            // Create Employ_work_log table
            db.run(`CREATE TABLE IF NOT EXISTS Employ_work_log (
                work_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id VARCHAR(45),
                work_hours VARCHAR(45),
                work_discriptior VARCHAR(45),
                Employes_employes_id INT,
                FOREIGN KEY (Employes_employes_id) REFERENCES Employes(employes_id)
            )`);

            // Create Servis_order_details table
            db.run(`CREATE TABLE IF NOT EXISTS Servis_order_details (
                order_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
                quantity INT,
                subtotal VARCHAR(45),
                Servises_servis_id INT,
                Servis_orders_order_id INT,
                FOREIGN KEY (Servises_servis_id) REFERENCES Servises(servis_id),
                FOREIGN KEY (Servis_orders_order_id) REFERENCES Servis_orders(order_id)
            )`);

            // Create Payments table
            db.run(`CREATE TABLE IF NOT EXISTS Payments (
                payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                payment_data DATE,
                payment_amount VARCHAR(45),
                payment_metod VARCHAR(45),
                Servis_order_details_order_detail_id INT,
                Servis_orders_order_id INT,
                FOREIGN KEY (Servis_order_details_order_detail_id) REFERENCES Servis_order_details(order_detail_id),
                FOREIGN KEY (Servis_orders_order_id) REFERENCES Servis_orders(order_id)
            )`);

            // Create junction table Servis_parts_has_Employes
            db.run(`CREATE TABLE IF NOT EXISTS Servis_parts_has_Employes (
                Servis_parts_Servis_part_id INT,
                Employes_employes_id INT,
                PRIMARY KEY (Servis_parts_Servis_part_id, Employes_employes_id),
                FOREIGN KEY (Servis_parts_Servis_part_id) REFERENCES Servis_parts(servis_part_id),
                FOREIGN KEY (Employes_employes_id) REFERENCES Employes(employes_id)
            )`);

            // Create junction table Fuel_Types_has_Servises
            db.run(`CREATE TABLE IF NOT EXISTS Fuel_Types_has_Servises (
                Fuel_Types_fuel_id INT,
                Servises_servis_id INT,
                PRIMARY KEY (Fuel_Types_fuel_id, Servises_servis_id),
                FOREIGN KEY (Fuel_Types_fuel_id) REFERENCES Fuel_Types(fuel_id),
                FOREIGN KEY (Servises_servis_id) REFERENCES Servises(servis_id)
            )`);

            console.log("All tables created successfully!");
        });
    }
});
