
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Получить все записи о запчастях
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Servis_parts';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить запись о запчасти по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Servis_parts WHERE servis_part_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ error: 'Запчасть не найдена' });
        res.status(200).json(result);
    });
});

// Добавить новую запчасть
router.post('/', (req, res) => {
    const { inventory_id, quantity_parts, total_price, servis_orders_order_id } = req.body;
    const query = 'INSERT INTO Servis_parts (inventory_id, quantity_parts, total_price, Servis_orders_order_id) VALUES (?, ?, ?, ?)';
    db.run(query, [inventory_id, quantity_parts, total_price, servis_orders_order_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Запчасть добавлена', servisPartId: this.lastID });
    });
});

// Обновить данные запчасти по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { inventory_id, quantity_parts, total_price, servis_orders_order_id } = req.body;
    const query = 'UPDATE Servis_parts SET inventory_id = ?, quantity_parts = ?, total_price = ?, Servis_orders_order_id = ? WHERE servis_part_id = ?';
    db.run(query, [inventory_id, quantity_parts, total_price, servis_orders_order_id, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Запчасть не найдена' });
        res.status(200).json({ message: 'Запчасть обновлена' });
    });
});

// Удалить запчасть по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Servis_parts WHERE servis_part_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Запчасть не найдена' });
        res.status(200).json({ message: 'Запчасть удалена' });
    });
});

module.exports = router;
