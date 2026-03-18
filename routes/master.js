const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Middleware: проверка роли мастера
function checkMasterRole(req, res, next) {
  if (!req.session.masterId) {
    return res.redirect("/admin/login");
  }
  if (req.session.masterRole !== "master") {
    return res.status(403).send("Доступ запрещен. Только для мастеров.");
  }
  next();
}

// GET /master/logout — выход
router.get("/logout", (req, res) => {
  delete req.session.masterId;
  delete req.session.masterRole;
  res.redirect("/admin/login");
});

// GET /master — главная страница мастера: список назначенных заказов
router.get("/", checkMasterRole, (req, res) => {
  const masterId = req.session.masterId;

  // Получаем данные самого мастера
  db.get("SELECT * FROM Employes WHERE employes_id = ?", [masterId], (err, master) => {
    if (err || !master) {
      console.error(err);
      return res.status(500).send("Ошибка сервера");
    }

    // Получаем заказы, назначенные этому мастеру, с данными клиента и авто
    db.all(
      `SELECT so.order_id, so.servis_data, so.order_status, so.total_amount, so.address,
              c.first_name, c.last_name, c.phone,
              ca.mark, ca.model, ca.year
       FROM Servis_orders so
       LEFT JOIN Customers c ON so.Customers_customer_id = c.customer_id
       LEFT JOIN Car ca ON so.Car_car_id = ca.car_id
       WHERE so.Employes_employes_id = ?
       ORDER BY so.order_id DESC`,
      [masterId],
      (err, orders) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Ошибка сервера");
        }
        res.render("master", { master, orders });
      }
    );
  });
});

// GET /master/order/:id — детали заказа для мастера
router.get("/order/:id", checkMasterRole, (req, res) => {
  const masterId = req.session.masterId;
  const orderId = req.params.id;

  db.get("SELECT * FROM Servis_orders WHERE order_id = ?", [orderId], (err, servis_orders) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Ошибка сервера");
    }
    if (!servis_orders) {
      return res.status(404).send("Заказ не найден");
    }
    // Убеждаемся, что заказ принадлежит этому мастеру
    if (servis_orders.Employes_employes_id !== masterId) {
      return res.status(403).send("Доступ запрещен.");
    }

    // Данные клиента
    db.get(
      "SELECT first_name || ' ' || last_name AS FIO, phone, email FROM Customers WHERE customer_id = ?",
      [servis_orders.Customers_customer_id],
      (err, customer) => {
        if (err) return res.status(500).send("Ошибка сервера");

        // Данные авто
        db.get("SELECT * FROM Car WHERE car_id = ?", [servis_orders.Car_car_id], (err, car) => {
          if (err) return res.status(500).send("Ошибка сервера");

          // Запчасти
          db.all(
            `SELECT i.inventory_name, i.inventory_price, sp.quantity_parts as quantity
             FROM Servis_parts sp
             JOIN Inventory i ON sp.inventory_id = i.inventory_id
             WHERE sp.Servis_orders_order_id = ?`,
            [orderId],
            (err, parts) => {
              if (err) return res.status(500).send("Ошибка сервера");

              // Услуги
              db.all(
                `SELECT s.servis_name, s.servis_price, sod.quantity
                 FROM Servis_order_details sod
                 JOIN Servises s ON sod.Servises_servis_id = s.servis_id
                 WHERE sod.Servis_orders_order_id = ?`,
                [orderId],
                (err, services) => {
                  if (err) return res.status(500).send("Ошибка сервера");

                  res.render("master-order-details", {
                    servis_orders,
                    customer,
                    car,
                    parts,
                    services,
                  });
                }
              );
            }
          );
        });
      }
    );
  });
});

// POST /master/update-profile — обновление профиля мастера
router.post("/update-profile", checkMasterRole, (req, res) => {
  const masterId = req.session.masterId;
  const { first_name, last_name, phone } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: "Имя и фамилия обязательны" });
  }

  db.run(
    "UPDATE Employes SET first_name = ?, last_name = ?, phone = ? WHERE employes_id = ?",
    [first_name, last_name, phone, masterId],
    function(err) {
      if (err) {
        console.error("Ошибка обновления профиля:", err);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ ok: true });
    }
  );
});

// GET /master/inventory — получение всего инвентаря для мастера
router.get("/inventory", checkMasterRole, (req, res) => {
  console.log("Master requested inventory. Session Master ID:", req.session.masterId);
  db.all("SELECT * FROM Inventory WHERE CAST(quantity_in_stock AS INTEGER) > 0 ORDER BY inventory_id ASC", [], (err, rows) => {
    if (err) {
      console.error("Database error in GET /master/inventory:", err);
      return res.status(500).json({ error: "Ошибка базы данных: " + err.message });
    }
    if (!rows || rows.length === 0) {
      console.log("No items found in Inventory with stock > 0");
    }
    res.json(rows);
  });
});

// POST /master/order/:id/add-parts — пакетное добавление запчастей
router.post("/order/:id/add-parts", checkMasterRole, async (req, res) => {
  const orderId = req.params.id;
  const masterId = req.session.masterId;
  const { parts } = req.body; // Ожидается массив [{ inventory_id, quantity }]

  if (!Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ error: "Список запчастей пуст" });
  }

  try {
    db.serialize(() => {
      let totalOrderIncrease = 0;
      let processedCount = 0;
      let errors = [];

      parts.forEach(p => {
        const { inventory_id, quantity } = p;
        const qty = parseInt(quantity);

        if (!inventory_id || isNaN(qty) || qty <= 0) {
          errors.push(`Неверные данные для ID ${inventory_id}`);
          return;
        }

        // Синхронная цепочка действий для каждой запчасти
        db.get("SELECT * FROM Inventory WHERE inventory_id = ?", [inventory_id], (err, part) => {
          if (err || !part) {
            errors.push(`Запчасть ${inventory_id} не найдена`);
            return;
          }

          const currentStock = parseInt(part.quantity_in_stock);
          if (currentStock < qty) {
            errors.push(`Недостаточно ${part.inventory_name} на складе`);
            return;
          }

          const partPrice = parseFloat(part.inventory_price);
          const itemTotal = partPrice * qty;
          totalOrderIncrease += itemTotal;

          // Обновляем склад
          db.run("UPDATE Inventory SET quantity_in_stock = ? WHERE inventory_id = ?", [(currentStock - qty).toString(), inventory_id]);

          // Добавляем в Servis_parts
          db.run(
            "INSERT INTO Servis_parts (inventory_id, quantity_parts, total_price, Servis_orders_order_id) VALUES (?, ?, ?, ?)",
            [inventory_id, qty.toString(), itemTotal.toString(), orderId],
            function(err) {
              if (!err) {
                const spId = this.lastID;
                // Привязываем мастера
                db.run("INSERT INTO Servis_parts_has_Employes (Servis_parts_Servis_part_id, Employes_employes_id) VALUES (?, ?)", [spId, masterId]);
              }
            }
          );
          
          processedCount++;
          
          // Если это была последняя запчасть в массиве
          if (processedCount + errors.length === parts.length) {
            // ФИНАЛЬНОЕ ОБНОВЛЕНИЕ ЗАКАЗА
            db.run(
              "UPDATE Servis_orders SET total_amount = CAST(total_amount AS FLOAT) + ? WHERE order_id = ?",
              [totalOrderIncrease, orderId],
              () => {
                if (errors.length > 0) {
                  res.status(207).json({ ok: true, message: "Выполнено частично", errors });
                } else {
                  res.json({ ok: true });
                }
              }
            );
          }
        });
      });
    });
  } catch (error) {
    console.error("Batch add error:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// POST /master/order/:id/status — обновление статуса заказа мастером
router.post("/order/:id/status", checkMasterRole, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const validStatuses = ["В обработке", "Мастер выехал", "Заказ отменён", "Заказ выполнен", "Закрыто"];

  if (!status) {
    return res.status(400).json({ error: "Статус не указан" });
  }

  db.run(
    "UPDATE Servis_orders SET order_status = ? WHERE order_id = ?",
    [status, orderId],
    function(err) {
      if (err) {
        console.error("Ошибка обновления статуса:", err);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ ok: true });
    }
  );
});

module.exports = router;
