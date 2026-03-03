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
            return res.render('6regauto', { car: null, error: 'Все поля должны быть заполнены.', success: null });
        }

        const customerId = req.session.customerId; // Получаем ID клиента из сессии
        const query = `
            INSERT INTO Car (mark, model, year, gos_nomer, wincode, Customers_customer_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Выполняем запрос в базу данных
        db.run(query, [brand, model, year, registrationNumber, vin, customerId], function(err) {
            if (err) {
                console.error('Ошибка при добавлении автомобиля:', err);
                return res.render('6regauto', { car: null, error: 'Произошла ошибка при регистрации автомобиля.', success: null });
            }
            req.session.success = 'Автомобиль успешно зарегистрирован!';
            res.redirect('/account');
        });
    } catch (error) {
        console.error('Ошибка при добавлении автомобиля:', error);
        res.render('6regauto', { car: null, error: 'Произошла ошибка при регистрации автомобиля.', success: null });
    }
});

// Рендер страницы для добавления автомобиля
router.get('/', (req, res) => {
    res.render('6regauto', { car: null, error: req.session.error || null, success: req.session.success || null });
});

// Удаление автомобиля
router.post('/delete/:id', (req, res) => {
    const carId = req.params.id;
    const customerId = req.session.customerId;

    if (!customerId) return res.redirect('/auth/login');

    db.run("DELETE FROM Car WHERE car_id = ? AND Customers_customer_id = ?", [carId, customerId], function(err) {
        if (err) {
            console.error('Ошибка при удалении автомобиля:', err);
            req.session.error = 'Ошибка при удалении автомобиля.';
        } else {
            req.session.success = 'Автомобиль удален.';
        }
        res.redirect('/account');
    });
});

// Страница редактирования
router.get('/edit/:id', (req, res) => {
    const carId = req.params.id;
    const customerId = req.session.customerId;

    if (!customerId) return res.redirect('/auth/login');

    db.get("SELECT * FROM Car WHERE car_id = ? AND Customers_customer_id = ?", [carId, customerId], (err, car) => {
        if (err || !car) {
            req.session.error = 'Автомобиль не найден.';
            return res.redirect('/account');
        }
        res.render('6regauto', { car, error: null, success: null });
    });
});

// Сохранение изменений
router.post('/edit/:id', (req, res) => {
    const carId = req.params.id;
    const customerId = req.session.customerId;
    const { brand, model, year, registrationNumber, vin } = req.body;

    if (!customerId) return res.redirect('/auth/login');

    const query = `
        UPDATE Car 
        SET mark = ?, model = ?, year = ?, gos_nomer = ?, wincode = ?
        WHERE car_id = ? AND Customers_customer_id = ?
    `;

    db.run(query, [brand, model, year, registrationNumber, vin, carId, customerId], function(err) {
        if (err) {
            console.error('Ошибка при обновлении автомобиля:', err);
            req.session.error = 'Ошибка при обновлении.';
            return res.redirect(`/car/edit/${carId}`);
        }
        req.session.success = 'Данные автомобиля обновлены.';
        res.redirect('/account');
    });
});

module.exports = router;
