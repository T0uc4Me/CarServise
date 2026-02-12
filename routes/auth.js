const express = require("express");
const router = express.Router();
const db = require("../db/database");
const bcrypt = require("bcrypt");

// Рендеринг страницы входа
router.get("/login", (req, res) => {
  res.render("3enter"); // Убедитесь, что файл views/3enter.ejs существует
});

// Рендеринг страницы регистрации
router.get("/reg", (req, res) => {
  res.render("2reg"); // Убедитесь, что файл views/2reg.ejs существует
});

// Рендеринг страницы сброса пароля
router.get("/reset-password", (req, res) => {
  res.render("5vospar"); // Убедитесь, что файл views/5vospar.ejs существует
});

// Регистрация пользователя
router.post("/reg", async (req, res) => {
  const { fio, email, phone, password, confirmPassword } = req.body;

  // Проверка на заполнение всех полей
  if (!fio || !email || !phone || !password || !confirmPassword) {
    req.session.error = "Пожалуйста, заполните все поля.";
    return res.redirect("/auth/reg");
  }

  // Проверка совпадения паролей
  if (password.trim() !== confirmPassword.trim()) {
    req.session.error = "Пароли не совпадают.";
    return res.redirect("/auth/reg");
  }

  try {
    // Проверка на существующего пользователя
    db.get("SELECT * FROM Customers WHERE email = ?", [email], async (err, existingUser) => {
      if (err) {
        console.error(err);
        req.session.error = "Ошибка сервера.";
        return res.redirect("/auth/reg");
      }

      if (existingUser) {
        req.session.error = "Пользователь с таким email уже существует.";
        return res.redirect("/auth/reg");
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password.trim(), 10);

      const [first_name, last_name] = fio.trim().split(' ');

      // Добавление нового пользователя
      db.run(
        "INSERT INTO Customers (first_name, last_name, email, phone, password, data_registrat, total_cost) VALUES (?, ?, ?, ?, ?, DATE('now'), ?)",
        [first_name, last_name || '', email.trim(), phone.trim(), hashedPassword, 0], function(err) {
          if (err) {
            console.error(err);
            req.session.error = "Ошибка сервера.";
            return res.redirect("/auth/reg");
          }
          req.session.success = "Пользователь успешно зарегистрирован!";
          res.redirect("/home2");
        }
      );
    });
  } catch (error) {
    console.error(error);
    req.session.error = "Ошибка сервера.";
    res.redirect("/auth/reg");
  }
});

// Авторизация пользователя
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Проверка на заполнение полей
  if (!email || !password) {
    req.session.error = "Введите email и пароль.";
    return res.redirect("/auth/login");
  }

  try {
    // Проверка существования пользователя
    const query = "SELECT * FROM Customers WHERE email = ?";
    db.get(query, [email], async (err, user) => {
      if (err) {
        console.error(err);
        req.session.error = "Ошибка сервера.";
        return res.redirect("/auth/login");
      }

      if (!user) {
        req.session.error = "Пользователь не найден!";
        return res.redirect("/auth/login");
      }

      // Проверка пароля
      const isMatch = await bcrypt.compare(password.trim(), user.password);
      if (!isMatch) {
        req.session.error = "Неверный пароль!";
        return res.redirect("/auth/login");
      }

      // Установка сессии
      req.session.userId = user.customer_id;
      req.session.email = user.email;

      res.redirect("/home2");
    });
  } catch (error) {
    console.error(error);
    req.session.error = "Ошибка сервера.";
    res.redirect("/auth/login");
  }
});

// Сброс пароля
router.post("/reset-password", async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  // Проверка на пустые поля
  if (!newPassword || !confirmPassword) {
    req.session.error = "Пожалуйста, заполните все поля.";
    return res.redirect("/auth/reset-password");
  }

  // Проверка совпадения паролей
  if (newPassword !== confirmPassword) {
    req.session.error = "Пароли не совпадают.";
    return res.redirect("/auth/reset-password");
  }

  try {
    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Обновление пароля в базе данных
    const query = "UPDATE Customers SET password = ? WHERE customer_id = ?";
    db.run(query, [hashedPassword, req.session.userId], function(err) {
      if (err) {
        console.error("Ошибка обновления пароля:", err);
        req.session.error = "Произошла ошибка, попробуйте снова.";
        return res.redirect("/auth/reset-password");
      }
      req.session.success = "Пароль успешно обновлен!";
      res.redirect("/auth/login");
    });
  } catch (error) {
    console.error("Ошибка обновления пароля:", error);
    req.session.error = "Произошла ошибка, попробуйте снова.";
    res.redirect("/auth/reset-password");
  }
});

module.exports = router;
