const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Убедитесь, что путь к файлу с подключением правильный

// Получить все записи рабочего журнала
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Employ_work_log';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить запись рабочего журнала по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Employ_work_log WHERE work_log_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: 'Запись не найдена' });
        res.status(200).json(result);
    });
});

// Создать новую запись в рабочем журнале
router.post('/', (req, res) => {
    const { order_id, work_hours, work_discriptor, employes_employes_id } = req.body;
    const query = 'INSERT INTO Employ_work_log (order_id, work_hours, work_discriptor, Employes_employes_id) VALUES (?, ?, ?, ?)';
    db.run(query, [order_id, work_hours, work_discriptor, employes_employes_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Запись добавлена', workLogId: this.lastID });
    });
});

// Обновить запись рабочего журнала по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { order_id, work_hours, work_discriptor, employes_employes_id } = req.body;
    const query = 'UPDATE Employ_work_log SET order_id = ?, work_hours = ?, work_discriptor = ?, Employes_employes_id = ? WHERE work_log_id = ?';
    db.run(query, [order_id, work_hours, work_discriptor, employes_employes_id, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.status(200).json({ message: 'Запись обновлена' });
    });
});

// Удалить запись рабочего журнала по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Employ_work_log WHERE work_log_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.status(200).json({ message: 'Запись удалена' });
    });
});

module.exports = router;