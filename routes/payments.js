const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Получить все платежи
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Payments';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить платеж по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Payments WHERE payment_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ error: 'Платеж не найден' });
        res.status(200).json(result);
    });
});

// Добавить новый платеж
router.post('/', (req, res) => {
    const { payment_data, payment_amount, payment_metod, servis_order_details_order_detail_id, servis_orders_order_id } = req.body;
    const query = 'INSERT INTO Payments (payment_data, payment_amount, payment_metod, Servis_order_details_order_detail_id, Servis_orders_order_id) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [payment_data, payment_amount, payment_metod, servis_order_details_order_detail_id, servis_orders_order_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Платеж добавлен', paymentId: this.lastID });
    });
});

// Обновить данные платежа по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { payment_data, payment_amount, payment_metod, servis_order_details_order_detail_id, servis_orders_order_id } = req.body;
    const query = 'UPDATE Payments SET payment_data = ?, payment_amount = ?, payment_metod = ?, Servis_order_details_order_detail_id = ?, Servis_orders_order_id = ? WHERE payment_id = ?';
    db.run(query, [payment_data, payment_amount, payment_metod, servis_order_details_order_detail_id, servis_orders_order_id, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Платеж не найден' });
        res.status(200).json({ message: 'Платеж обновлен' });
    });
});

// Удалить платеж по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Payments WHERE payment_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Платеж не найден' });
        res.status(200).json({ message: 'Платеж удален' });
    });
});

module.exports = router;