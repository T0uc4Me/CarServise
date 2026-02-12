const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Получить все записи
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Servis_order_details';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Получить запись по ID
router.get('/:id', (req, res) => {
    const query = 'SELECT * FROM Servis_order_details WHERE order_detail_id = ?';
    db.get(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// Создать новую запись
router.post('/', (req, res) => {
    const { quantity, subtotal, servises_servis_id, servis_orders_order_id } = req.body;
    const query = 'INSERT INTO Servis_order_details (quantity, subtotal, Servises_servis_id, Servis_orders_order_id) VALUES (?, ?, ?, ?)';
    db.run(query, [quantity, subtotal, servises_servis_id, servis_orders_order_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Запись создана', orderDetailId: this.lastID });
    });
});

// Обновить запись по ID
router.put('/:id', (req, res) => {
    const { quantity, subtotal, servises_servis_id, servis_orders_order_id } = req.body;
    const query = 'UPDATE Servis_order_details SET quantity = ?, subtotal = ?, Servises_servis_id = ?, Servis_orders_order_id = ? WHERE order_detail_id = ?';
    db.run(query, [quantity, subtotal, servises_servis_id, servis_orders_order_id, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.json({ message: 'Запись обновлена' });
    });
});

// Удалить запись по ID
router.delete('/:id', (req, res) => {
    const query = 'DELETE FROM Servis_order_details WHERE order_detail_id = ?';
    db.run(query, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.json({ message: 'Запись удалена' });
    });
});

module.exports = router;