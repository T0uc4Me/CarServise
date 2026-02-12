const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Убедитесь, что путь к файлу с подключением правильный

// Получить все типы топлива
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Fuel_Types';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить тип топлива по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Fuel_Types WHERE fuel_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: 'Тип топлива не найден' });
        res.status(200).json(result);
    });
});

// Создать новый тип топлива
router.post('/', (req, res) => {
    const { fuel_name, fuel_price } = req.body;
    const query = 'INSERT INTO Fuel_Types (fuel_name, fuel_price) VALUES (?, ?)';
    db.run(query, [fuel_name, fuel_price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Тип топлива добавлен', fuelId: this.lastID });
    });
});

// Обновить тип топлива по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { fuel_name, fuel_price } = req.body;
    const query = 'UPDATE Fuel_Types SET fuel_name = ?, fuel_price = ? WHERE fuel_id = ?';
    db.run(query, [fuel_name, fuel_price, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Тип топлива не найден' });
        res.status(200).json({ message: 'Тип топлива обновлен' });
    });
});

// Удалить тип топлива по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Fuel_Types WHERE fuel_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Тип топлива не найден' });
        res.status(200).json({ message: 'Тип топлива удален' });
    });
});

module.exports = router;