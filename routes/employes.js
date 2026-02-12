const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Убедитесь, что путь к файлу с подключением правильный

// Получить всех сотрудников
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Employes';
    db.all(query, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Получить сотрудника по ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Employes WHERE employes_id = ?';
    db.get(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: 'Сотрудник не найден' });
        res.status(200).json(result);
    });
});

// Создать нового сотрудника
router.post('/', (req, res) => {
    const { first_name, last_name, phone, email, role, hire_date, salary, status } = req.body;
    const query = 'INSERT INTO Employes (first_name, last_name, phone, email, role, hire_date, salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(query, [first_name, last_name, phone, email, role, hire_date, salary, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Сотрудник добавлен', employesId: this.lastID });
    });
});

// Обновить данные сотрудника по ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, email, role, hire_date, salary, status } = req.body;
    const query = 'UPDATE Employes SET first_name = ?, last_name = ?, phone = ?, email = ?, role = ?, hire_date = ?, salary = ?, status = ? WHERE employes_id = ?';
    db.run(query, [first_name, last_name, phone, email, role, hire_date, salary, status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Сотрудник не найден' });
        res.status(200).json({ message: 'Данные сотрудника обновлены' });
    });
});

// Удалить сотрудника по ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Employes WHERE employes_id = ?';
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Сотрудник не найден' });
        res.status(200).json({ message: 'Сотрудник удален' });
    });
});

module.exports = router;