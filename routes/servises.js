const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Убедитесь, что подключение к базе данных настроено правильно

// Получение всех услуг
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Servises';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получение услуги по ID
router.get('/:id', (req, res) => {
    const query = 'SELECT * FROM Servises WHERE servis_id = ?';
    db.get(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: 'Услуга не найдена' });
        res.status(200).json(result);
    });
});

// Добавление новой услуги
router.post('/', (req, res) => {
    const { servis_name, servis_price } = req.body;
    const query = 'INSERT INTO Servises (servis_name, servis_price) VALUES (?, ?)';
    db.run(query, [servis_name, servis_price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Услуга добавлена', servisId: this.lastID });
    });
});

// Обновление услуги по ID
router.put('/:id', (req, res) => {
    const { servis_name, servis_price } = req.body;
    const query = 'UPDATE Servises SET servis_name = ?, servis_price = ? WHERE servis_id = ?';
    db.run(query, [servis_name, servis_price, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Услуга не найдена' });
        res.status(200).json({ message: 'Услуга обновлена' });
    });
});

// Удаление услуги по ID
router.delete('/:id', (req, res) => {
    const query = 'DELETE FROM Servises WHERE servis_id = ?';
    db.run(query, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Услуга не найдена' });
        res.status(200).json({ message: 'Услуга удалена' });
    });
});

module.exports = router;