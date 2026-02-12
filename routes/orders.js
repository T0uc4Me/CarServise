const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    // Получаем информацию о заказе
    db.get("SELECT * FROM Servis_orders WHERE order_id = ?", [orderId], (err, servis_orders) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Ошибка сервера");
      }

      if (!servis_orders) {
        return res.status(404).send("Заказ не найден");
      }

      // Получаем информацию о клиенте
      db.get("SELECT * FROM Customers WHERE customer_id = ?", [servis_orders.Customers_customer_id], (err, customer) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Ошибка сервера");
        }

        // Получаем информацию об автомобиле
        db.get("SELECT * FROM Car WHERE car_id = ?", [servis_orders.Car_car_id], (err, car) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Ошибка сервера");
          }

          // Получаем использованные запчасти
          db.all(
            `
            SELECT i.inventory_name, i.inventory_price, sp.quantity_parts as quantity
            FROM Servis_parts sp
            JOIN Inventory i ON sp.inventory_id = i.inventory_id
            WHERE sp.Servis_orders_order_id = ?
            `,
            [orderId],
            (err, parts) => {
              if (err) {
                console.error(err);
                return res.status(500).send("Ошибка сервера");
              }

              // Получаем услуги, оказанные в заказе
              db.all(
                `
                SELECT s.servis_name, s.servis_price, sod.quantity
                FROM Servis_order_details sod
                JOIN Servises s ON sod.Servises_servis_id = s.servis_id
                WHERE sod.Servis_orders_order_id = ?
                `,
                [orderId],
                (err, services) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send("Ошибка сервера");
                  }

                  res.render("order-details", {
                    servis_orders,
                    customer,
                    car,
                    parts,
                    services, // Передаем услуги в шаблон
                  });
                }
              );
            }
          );
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = router;
