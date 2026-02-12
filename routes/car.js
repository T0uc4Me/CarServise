const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Подключение к базе данных

// Маршрут для добавления автомобиля
router.post('/', async (req, res) => {
    try {
        const { brand, model, year, registrationNumber, vin } = req.body;

        // Проверяем, что все поля заполнены
        if (!brand || !model || !year || !registrationNumber || !vin) {
            req.session.error = 'Все поля должны быть заполнены.';
            return res.redirect('/car');
        }

        const customerId = req.session.userId; // Получаем ID клиента из сессии
        const query = `
            INSERT INTO Car (mark, model, year, gos_nomer, wincode, Customers_customer_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Выполняем запрос в базу данных
        db.run(query, [brand, model, year, registrationNumber, vin, customerId], function(err) {
            if (err) {
                console.error('Ошибка при добавлении автомобиля:', err);
                req.session.error = 'Произошла ошибка при регистрации автомобиля.';
                return res.redirect('/car');
            }
            req.session.success = 'Автомобиль успешно зарегистрирован!';
            res.redirect('/account');
        });
    } catch (error) {
        console.error('Ошибка при добавлении автомобиля:', error);
        req.session.error = 'Произошла ошибка при регистрации автомобиля.';
        res.redirect('/car');
    }
});

// Рендер страницы для добавления автомобиля
router.get('/', (req, res) => {
    res.render('6regauto'); // Убедитесь, что файл views/car.ejs существует
});

module.exports = router;