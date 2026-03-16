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

// GET /master/logout
router.get("/logout", (req, res) => {
  delete req.session.masterId;
  delete req.session.masterRole;
  res.redirect("/admin/login");
});

module.exports = router;
