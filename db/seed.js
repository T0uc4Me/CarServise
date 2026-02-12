const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'carservice.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database for seeding.");

        db.serialize(() => {
            const hashedPasswordCustomer1 = bcrypt.hashSync('customer1pass', 10);
            const hashedPasswordCustomer2 = bcrypt.hashSync('customer2pass', 10);

            // Sample data for Customers
            const insertCustomer = db.prepare(`INSERT INTO Customers (first_name, last_name, email, phone, address, data_registrat, total_cost, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            insertCustomer.run('Иван', 'Иванов', 'ivan@example.com', '123-456-7890', 'Ул. Ленина, 1', '2023-01-15', '15000', hashedPasswordCustomer1);
            insertCustomer.run('Мария', 'Петрова', 'maria@example.com', '098-765-4321', 'Ул. Пушкина, 10', '2023-02-20', '22000', hashedPasswordCustomer2);
            insertCustomer.finalize();

            // Sample data for Employes
            const hashedPassword = bcrypt.hashSync('pro_lofix308', 10);
            const insertEmployee = db.prepare(`INSERT INTO Employes (first_name, last_name, phone, email, role, hire_date, salary, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            insertEmployee.run('Алексей', 'Смирнов', '555-111-2233', 'alexey@carservice.com', 'Механик', '2022-03-01', '70000', 'Активен', bcrypt.hashSync('password123', 10));
            insertEmployee.run('Админ', 'Админов', '555-444-5566', 'pro319_pro319@mail.ru', 'admin', '2021-06-10', '60000', 'Активен', hashedPassword);
            insertEmployee.finalize();

            // Sample data for Car
            const insertCar = db.prepare(`INSERT INTO Car (mark, model, year, gos_nomer, wincode, Customers_customer_id) VALUES (?, ?, ?, ?, ?, ?)`);
            insertCar.run('Toyota', 'Camry', '2018-01-01', 'А123БВ', 'VIN123456789', 1);
            insertCar.run('BMW', 'X5', '2020-01-01', 'В456ГД', 'VIN987654321', 2);
            insertCar.finalize();

            // Sample data for Fuel_Types
            const insertFuelType = db.prepare(`INSERT INTO Fuel_Types (fuel_name, fuel_price) VALUES (?, ?)`);
            insertFuelType.run('Бензин АИ-95', '50');
            insertFuelType.run('Дизель', '55');
            insertFuelType.finalize();

            // Sample data for Servises
            const insertService = db.prepare(`INSERT INTO Servises (servis_name, servis_type, servis_price) VALUES (?, ?, ?)`);
            insertService.run('Замена масла', 'ТО', '2500');
            insertService.run('Шиномонтаж', 'Ремонт', '3000');
            insertService.run('Диагностика двигателя', 'Диагностика', '1500');
            insertService.run('Замена тормозных колодок', 'Ремонт', '3500');
            insertService.run('Проверка уровня жидкостей', 'ТО', '500');
            insertService.run('Регулировка развал-схождения', 'Ремонт', '2000');
            insertService.run('Заправка кондиционера', 'Обслуживание', '2500');
            insertService.finalize();

            // Sample data for Inventory
            const insertInventory = db.prepare(`INSERT INTO Inventory (inventory_name, inventory_discription, quantity_in_stock, inventory_price) VALUES (?, ?, ?, ?)`);
            insertInventory.run('Масляный фильтр', 'Фильтр для двигателя', '100', '800');
            insertInventory.run('Комплект шин', 'Летние шины R16', '50', '20000');
            insertInventory.finalize();

            // Sample data for Servis_orders
            const insertServisOrder = db.prepare(`INSERT INTO Servis_orders (servis_data, total_amount, order_status, Car_car_id, Customers_customer_id, Employes_employes_id) VALUES (?, ?, ?, ?, ?, ?)`);
            insertServisOrder.run('2023-03-01 10:00:00', '5500', 'Завершено', 1, 1, 1);
            insertServisOrder.run('2023-03-05 14:30:00', '23000', 'В работе', 2, 2, 1);
            insertServisOrder.finalize();

            // Sample data for Servis_parts
            const insertServisPart = db.prepare(`INSERT INTO Servis_parts (inventory_id, quantity_parts, total_price, Servis_orders_order_id) VALUES (?, ?, ?, ?)`);
            insertServisPart.run(1, '1', '800', 1);
            insertServisPart.run(2, '4', '20000', 2);
            insertServisPart.finalize();

            // Sample data for Employ_work_log
            const insertWorkLog = db.prepare(`INSERT INTO Employ_work_log (order_id, work_hours, work_discriptior, Employes_employes_id) VALUES (?, ?, ?, ?)`);
            insertWorkLog.run('1', '2', 'Замена масляного фильтра', 1);
            insertWorkLog.run('2', '3', 'Монтаж шин', 1);
            insertWorkLog.finalize();

            // Sample data for Servis_order_details
            const insertOrderDetail = db.prepare(`INSERT INTO Servis_order_details (quantity, subtotal, Servises_servis_id, Servis_orders_order_id) VALUES (?, ?, ?, ?)`);
            insertOrderDetail.run(1, '2500', 1, 1);
            insertOrderDetail.run(1, '3000', 2, 2);
            insertOrderDetail.finalize();

            // Sample data for Payments
            const insertPayment = db.prepare(`INSERT INTO Payments (payment_data, payment_amount, payment_metod, Servis_order_details_order_detail_id, Servis_orders_order_id) VALUES (?, ?, ?, ?, ?)`);
            insertPayment.run('2023-03-01', '5500', 'Наличные', 1, 1);
            insertPayment.run('2023-03-05', '23000', 'Карта', 2, 2);
            insertPayment.finalize();

            // Sample data for Servis_parts_has_Employes (junction table)
            const insertServisPartsEmployes = db.prepare(`INSERT INTO Servis_parts_has_Employes (Servis_parts_Servis_part_id, Employes_employes_id) VALUES (?, ?)`);
            insertServisPartsEmployes.run(1, 1);
            insertServisPartsEmployes.finalize();

            // Sample data for Fuel_Types_has_Servises (junction table)
            const insertFuelTypesServises = db.prepare(`INSERT INTO Fuel_Types_has_Servises (Fuel_Types_fuel_id, Servises_servis_id) VALUES (?, ?)`);
            insertFuelTypesServises.run(1, 1);
            insertFuelTypesServises.finalize();

            console.log("Database seeded with mock data.");
        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed the database connection after seeding.');
        });
    }
});
