const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET запрос для страницы личного кабинета
router.get('/', async (req, res) => {
    try {
        const userId = req.session.userId; // ID текущего пользователя
        if (!userId) {
            return res.redirect('/auth/login'); // Перенаправление на страницу входа, если пользователь не авторизован
        }

        // Получение информации о пользователе
        db.get('SELECT first_name, last_name, phone, email, data_registrat, total_cost FROM Customers WHERE customer_id = ?', [userId], (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).render('error', { message: 'Ошибка сервера.' });
            }
            if (!user) {
                return res.status(404).render('error', { message: 'Пользователь не найден.' });
            }
            const fio = `${user.first_name} ${user.last_name}`;

            // Получение списка машин пользователя
            db.all('SELECT mark, model FROM Car WHERE Customers_customer_id = ?', [userId], (err, cars) => {
                if (err) {
                    console.error(err);
                    return res.status(500).render('error', { message: 'Ошибка сервера.' });
                }

                // Рендер страницы с данными пользователя и автомобилей
                res.render('4lk', { 
                    fio: fio, 
                    phone: user.phone,
                    email: user.email,
                    date: user.data_registrat,
                    cost: user.total_cost,
                    cars 
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.render('error', {
            message: 'Ошибка сервера.',
            error: { status: 500, stack: error.stack },
        });
    }
});

// POST запрос для добавления нового автомобиля
router.post('/add-car', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован.' });
        }

        const { mark, model } = req.body;

        if (!mark || !model) {
            return res.status(400).json({ error: 'Марка и модель автомобиля обязательны.' });
        }

        // Добавление нового автомобиля
        db.run(
            'INSERT INTO Car (mark, model, Customers_customer_id) VALUES (?, ?, ?)',
            [mark, model, userId],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Ошибка сервера.' });
                }
                res.status(200).json({ message: 'Автомобиль успешно добавлен.' });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

module.exports = router;
