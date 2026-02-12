const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Получить все заказы
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Servis_orders';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить заказ по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Servis_orders WHERE order_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ error: 'Заказ не найден' });
        res.status(200).json(result);
    });
});

// Добавить новый заказ
router.post('/', (req, res) => {
    const { servis_data, total_amount, order_status, adress, car_car_id, customers_customer_id } = req.body;
    const query = 'INSERT INTO Servis_orders (servis_data, total_amount, order_status, adress, Car_car_id, Customers_customer_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [servis_data, total_amount, order_status, adress, car_car_id, customers_customer_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Заказ добавлен', orderId: this.lastID });
    });
});

// Обновить данные заказа по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { servis_data, total_amount, order_status, adress, car_car_id, customers_customer_id } = req.body;
    const query = 'UPDATE Servis_orders SET servis_data = ?, total_amount = ?, order_status = ?, adress = ?, Car_car_id = ?, Customers_customer_id = ? WHERE order_id = ?';
    db.run(query, [servis_data, total_amount, order_status, adress, car_car_id, customers_customer_id, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.status(200).json({ message: 'Заказ обновлен' });
    });
});

// Удалить заказ по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Servis_orders WHERE order_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.status(200).json({ message: 'Заказ удален' });
    });
});

module.exports = router;