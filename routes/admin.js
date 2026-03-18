const express = require("express");
const router = express.Router();
const db = require("../db/database");
const bcrypt = require("bcrypt");

// Функция для проверки роли админа
function checkAdminRole(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect("/admin/login"); // Если пользователь не авторизован, перенаправляем на страницу входа
  }

  if (req.session.adminRole !== "admin") {
    return res.status(403).send("Доступ запрещен. Только для администраторов."); // Если роль не "admin", запрещаем доступ
  }

  next(); // Если все проверки пройдены, переходим к следующему обработчику
}

// Главная страница админ-панели
router.get("/", checkAdminRole, async (req, res) => {
  try {
    // Получаем активные заказы (те, что еще не закрыты, не выполнены и не отменены)
    db.all("SELECT * FROM servis_orders WHERE order_status NOT IN ('closed', 'Заказ выполнен', 'Заказ отменён') OR order_status IS NULL", [], (err, activeOrders) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера");
      }
      
      // Получаем историю заказов (завершенные, выполненные и отмененные)
      db.all("SELECT * FROM servis_orders WHERE order_status IN ('closed', 'Заказ выполнен', 'Заказ отменён') ORDER BY order_id DESC", [], (err, historyOrders) => {
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
            historyOrders,
            inventory,
            userRole: req.session.adminRole,
            userId: req.session.adminId,
          });
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
  const error = req.session.staffLoginError;
  delete req.session.staffLoginError;
  res.render("staff-login", { error });
});

// Обработка входа
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get("SELECT * FROM Employes WHERE email = ?", [email], async (err, user) => {
      if (err) {
        console.error(err);
        req.session.staffLoginError = "Ошибка сервера";
        return res.redirect("/admin/login");
      }

      if (!user) {
        req.session.staffLoginError = "Неверный email или пароль";
        return res.redirect("/admin/login");
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        req.session.staffLoginError = "Неверный email или пароль";
        return res.redirect("/admin/login");
      }

      if (user.role === "admin") {
        req.session.adminId = user.employes_id;
        req.session.adminRole = user.role;
        res.redirect("/admin");
      } else if (user.role === "master" || user.role === "mechanic" || user.role === "Механик") {
        req.session.masterId = user.employes_id;
        req.session.masterRole = "master"; // Синхронизируем роль для middleware
        res.redirect("/master");
      } else {
        req.session.staffLoginError = "У вас нет доступа к этой панели";
        res.redirect("/admin/login");
      }
    });
  } catch (error) {
    console.error(error);
    req.session.staffLoginError = "Ошибка сервера";
    res.redirect("/admin/login");
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

// Выход из админ-панели
router.get("/logout", (req, res) => {
  delete req.session.adminId;
  delete req.session.adminRole;
  res.redirect("/admin/login");
});

// GET /admin/masters — список мастеров (JSON, для dropdown в панели)
router.get("/masters", checkAdminRole, (req, res) => {
  db.all("SELECT employes_id, first_name, last_name, role FROM Employes WHERE role IN ('master', 'mechanic', 'Механик')", [], (err, masters) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
    res.json(masters);
  });
});

// PUT /admin/assign-master/:orderId — назначить мастера на заказ
router.put("/assign-master/:orderId", checkAdminRole, (req, res) => {
  const { orderId } = req.params;
  const { masterId } = req.body;

  if (!masterId) {
    return res.status(400).json({ error: "masterId не указан" });
  }

  db.run(
    "UPDATE Servis_orders SET Employes_employes_id = ? WHERE order_id = ?",
    [masterId, orderId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Заказ не найден" });
      }
      res.status(200).json({ ok: true });
    }
  );
});

// PUT /admin/update-inventory/:originalId — обновление инвентаря (включая имя и ID)
router.put("/update-inventory/:originalId", checkAdminRole, (req, res) => {
  const { originalId } = req.params;
  const { newId, inventory_name, quantity_in_stock, inventory_price, inventory_discription } = req.body;

  db.serialize(() => {
    // Включаем поддержку foreign_keys (чтобы на всякий случай не сломать, если не нужно)
    // Но для изменения PK с зависимыми записями без CASCADE может быть блокировка.
    // Если пользователь решил менять ID, предполагаем он понимает последствия или это новая запись.
    db.run("PRAGMA foreign_keys = OFF", (err) => {
      db.run(
        "UPDATE Inventory SET inventory_id = ?, inventory_name = ?, quantity_in_stock = ?, inventory_price = ?, inventory_discription = ? WHERE inventory_id = ?",
        [newId || originalId, inventory_name, quantity_in_stock, inventory_price, inventory_discription, originalId],
        function(updateErr) {
          db.run("PRAGMA foreign_keys = ON");
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: "Ошибка сервера" });
          }
          res.json({ ok: true });
        }
      );
    });
  });
});

module.exports = router;
