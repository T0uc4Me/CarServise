const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Получение всех клиентов
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Customers';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Получение клиента по ID
router.get('/:id', (req, res) => {
    const query = 'SELECT * FROM Customers WHERE customer_id = ?';
    db.get(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: 'Клиент не найден' });
        res.json(result);
    });
});

// Создание нового клиента
router.post('/', (req, res) => {
    const { FIO, email, phone, data_registrat, total_cost } = req.body;
    const query = 'INSERT INTO Customers (first_name, last_name, email, phone, data_registrat, total_cost) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [FIO.split(' ')[0], FIO.split(' ')[1], email, phone, data_registrat, total_cost], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Клиент добавлен', customerId: this.lastID });
    });
});

// Обновление данных клиента
router.put('/:id', (req, res) => {
    const { FIO, email, phone, data_registrat, total_cost } = req.body;
    const query = 'UPDATE Customers SET first_name = ?, last_name = ?, email = ?, phone = ?, data_registrat = ?, total_cost = ? WHERE customer_id = ?';
    db.run(query, [FIO.split(' ')[0], FIO.split(' ')[1], email, phone, data_registrat, total_cost, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Клиент не найден' });
        res.json({ message: 'Данные клиента обновлены' });
    });
});

// Удаление клиента
router.delete('/:id', (req, res) => {
    const query = 'DELETE FROM Customers WHERE customer_id = ?';
    db.run(query, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Клиент не найден' });
        res.json({ message: 'Клиент удален' });
    });
});

module.exports = router;