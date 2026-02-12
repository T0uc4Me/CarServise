const express = require("express");
const router = express.Router();
const db = require("../db/database");
const bcrypt = require("bcrypt");

// Функция для проверки роли админа
function checkAdminRole(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/admin/login"); // Если пользователь не авторизован, перенаправляем на страницу входа
  }

  if (req.session.userRole !== "admin") {
    return res.status(403).send("Доступ запрещен. Только для администраторов."); // Если роль не "admin", запрещаем доступ
  }

  next(); // Если все проверки пройдены, переходим к следующему обработчику
}

// Главная страница админ-панели
router.get("/", checkAdminRole, async (req, res) => {
  try {
    // Получаем активные заказы
    db.all("SELECT * FROM servis_orders WHERE order_status = 'active'", [], (err, activeOrders) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера");
      }
      // Получаем инвентарь
      db.all("SELECT * FROM inventory", [], (err, inventory) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Ошибка сервера");
        }
        res.render("admin", {
          activeOrders,
          inventory,
          userRole: req.session.userRole,
          userId: req.session.userId,
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});

// Маршрут для страницы входа
router.get("/login", (req, res) => {
  res.render("admin-login");
});

// Обработка входа
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    db.all("SELECT * FROM Employes WHERE email = ?", [email], async (err, users) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера");
      }

      if (users.length === 0) {
        return res.status(401).send("Неверный email или пароль");
      }

      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).send("Неверный email или пароль");
      }

      // Сохраняем данные о пользователе в сессии
      req.session.userId = user.employes_id;
      req.session.userRole = user.role;

      if (user.role === "admin") {
        res.redirect("/admin");
      } else {
        res.redirect("/");  // Для пользователей с другой ролью перенаправляем на домашнюю страницу
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});

// Маршрут для страницы регистрации
router.get("/register", (req, res) => {
  res.render("admin-register");
});

// Обработка регистрации
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

    // Проверка существующего email
    db.all("SELECT * FROM Employes WHERE email = ?", [email], async (err, existingUsers) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера");
      }

      if (existingUsers.length > 0) {
        return res.status(400).send("Пользователь с таким email уже существует");
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Добавление нового сотрудника
      db.run(
        "INSERT INTO Employes (first_name, last_name, email, phone, password, role, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), 'active')",
        [first_name, last_name, email, phone, hashedPassword, role], function(err) {
          if (err) {
            console.error(err);
            return res.status(500).send("Ошибка сервера");
          }
          res.redirect("/admin/login");
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});

// Маршрут для закрытия заказа
router.put("/close-order/:orderId", checkAdminRole, (req, res) => {
  const { orderId } = req.params;

  db.run("UPDATE servis_orders SET order_status = 'closed' WHERE order_id = ?",
    [orderId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера при закрытии заказа");
      }
      if (this.changes === 0) {
        return res.status(404).send("Заказ не найден");
      }
      res.status(200).send("Заказ успешно закрыт");
    }
  );
});

// Маршрут для удаления предмета из инвентаря
router.delete("/delete-item/:inventoryId", checkAdminRole, (req, res) => {
  const { inventoryId } = req.params;

  db.run("DELETE FROM Inventory WHERE inventory_id = ?", [inventoryId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка сервера при удалении предмета");
    }
    if (this.changes === 0) {
      return res.status(404).send("Предмет не найден");
    }
    res.status(200).send("Предмет успешно удален");
  });
});

module.exports = router;
