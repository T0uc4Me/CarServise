const express = require("express");
const router = express.Router();
const db = require("../db/database");

// GET запрос на страницу заказа
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId; // Получаем ID пользователя из сессии
    if (!userId) {
      return res.redirect("/auth/login"); // Если пользователь не авторизован, перенаправляем на страницу входа
    }

    // Получение имени пользователя
    db.get("SELECT first_name, last_name FROM Customers WHERE customer_id = ?", [userId], (err, userRow) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .render("error", { message: "Ошибка сервера." });
      }
      if (!userRow) {
        return res
          .status(404)
          .render("error", { message: "Пользователь не найден." });
      }
      const userName = `${userRow.first_name} ${userRow.last_name}`;

      // Получение списка автомобилей пользователя
      db.all(
        "SELECT car_id, mark, model FROM Car WHERE Customers_customer_id = ?",
        [userId],
        (err, cars) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .render("error", { message: "Ошибка сервера." });
          }

          // Получение списка услуг для отображения
          db.all("SELECT servis_id, servis_name, servis_price FROM Servises", [], (err, services) => {
            if (err) {
              console.error(err);
              return res
                .status(500)
                .render("error", { message: "Ошибка сервера." });
            }

            // Рендерим страницу, передавая имя пользователя, автомобили и услуги
            res.render("9pd", { fio: userName, cars, services });
          });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.render("error", {
      message: "Ошибка сервера.",
      error: { status: 500, stack: error.stack },
    });
  }
});

// POST запрос на создание заказа
router.post("/", async (req, res) => {
  try {
    const customerId = req.session.userId;
    if (!customerId) {
      return res
        .status(401)
        .render("error", { message: "Пользователь не авторизован." });
    }

    const { carId, address, additionalRequirements, services, payment_method } = req.body;

    const quantities = {};
    for (const key in req.body) {
      if (key.startsWith("quantity_")) {
        const serviceId = key.replace("quantity_", "");
        quantities[serviceId] = parseInt(req.body[key]) || 1;
      }
    }

    if (!carId) {
      return res.status(400).render("error", {
        message: "Автомобиль не выбран. Пожалуйста, выберите автомобиль.",
      });
    }

    db.all(
      `SELECT employes_id FROM Employes WHERE status = 'active' LIMIT 1`,
      [],
      (err, employeeRows) => {
        if (err) {
          console.error(err);
          return res.status(500).render("error", {
            message: "Ошибка сервера.",
            error: { status: 500, stack: err.stack },
          });
        }

        if (employeeRows.length === 0) {
          return res.status(500).render("error", {
            message: "Нет доступных сотрудников для обработки заказа.",
          });
        }
        const activeEmployeeId = employeeRows[0].employes_id;

        let totalAmount = 0;
        const servicePromises = [];

        if (Array.isArray(services) && services.length > 0) {
          for (const serviceId of services) {
            servicePromises.push(new Promise((resolve, reject) => {
              db.get(`SELECT servis_price FROM Servises WHERE servis_id = ?`, [serviceId], (err, serviceRow) => {
                if (err) return reject(err);
                if (!serviceRow) return resolve(0);
                const servicePrice = parseFloat(serviceRow.servis_price) || 0;
                const quantity = quantities[serviceId] || 1;
                resolve(servicePrice * quantity);
              });
            }));
          }
        }

        Promise.all(servicePromises)
          .then((amounts) => {
            totalAmount = amounts.reduce((sum, current) => sum + current, 0);

            // Вставляем заказ в таблицу servis_orders
            db.run(
              `INSERT INTO Servis_orders 
                   (servis_data, order_status, address, Customers_customer_id, Car_car_id, Employes_employes_id, total_amount) 
                   VALUES (DATE('now'), 'active', ?, ?, ?, ?, ?)`,
              [address || "", customerId, carId, activeEmployeeId, totalAmount],
              function (err) {
                if (err) {
                  console.error(err);
                  return res.status(500).render("error", {
                    message: "Ошибка сервера.",
                    error: { status: 500, stack: err.stack },
                  });
                }

                const orderId = this.lastID;
                const detailPromises = [];

                // Вставляем детали заказа в таблицу servis_order_details
                if (Array.isArray(services) && services.length > 0) {
                  for (const serviceId of services) {
                    const quantity = quantities[serviceId] || 1;

                    detailPromises.push(new Promise((resolve, reject) => {
                      db.run(
                        `INSERT INTO Servis_order_details 
                            (quantity, Servises_servis_id, Servis_orders_order_id, subtotal) 
                            VALUES (?, ?, ?, ?)`,
                        [
                          quantity,
                          serviceId,
                          orderId,
                          quantity * (quantities[serviceId] || 1),
                        ],
                        function (err) {
                          if (err) return reject(err);
                          resolve();
                        }
                      );
                    }));
                  }
                }

                Promise.all(detailPromises)
                  .then(() => {
                    // Сохраняем информацию о платеже в таблице payments
                    db.run(
                      `INSERT INTO Payments 
                           (payment_data, payment_amount, payment_metod, Servis_order_details_order_detail_id, Servis_orders_order_id) 
                           VALUES (DATE('now'), ?, ?, ?, ?)`,
                      [totalAmount, payment_method, null, orderId],
                      function (err) {
                        if (err) {
                          console.error(err);
                          return res.status(500).render("error", {
                            message: "Ошибка сервера.",
                            error: { status: 500, stack: err.stack },
                          });
                        }

                        // Передача сообщения об успехе
                        db.get("SELECT first_name, last_name FROM Customers WHERE customer_id = ?", [customerId], (err, userRow) => {
                          if (err) {
                            console.error(err);
                            return res.status(500).render("error", {
                              message: "Ошибка сервера.",
                              error: { status: 500, stack: err.stack },
                            });
                          }
                          const userName = userRow ? `${userRow.first_name} ${userRow.last_name}` : "Неизвестный пользователь";

                          db.all("SELECT car_id, mark, model FROM Car WHERE Customers_customer_id = ?", [customerId], (err, cars) => {
                            if (err) {
                              console.error(err);
                              return res.status(500).render("error", {
                                message: "Ошибка сервера.",
                                error: { status: 500, stack: err.stack },
                              });
                            }

                            db.all("SELECT servis_id, servis_name, servis_price FROM Servises", [], (err, servicesList) => {
                              if (err) {
                                console.error(err);
                                return res.status(500).render("error", {
                                  message: "Ошибка сервера.",
                                  error: { status: 500, stack: err.stack },
                                });
                              }

                              res.render("9pd", {
                                fio: userName,
                                cars,
                                services: servicesList,
                                successMessage: "Ваш заказ успешно оформлен!",
                              });
                            });
                          });
                        });
                      }
                    );
                  })
                  .catch((err) => {
                    console.error(err);
                    res.status(500).render("error", {
                      message: "Ошибка сервера при сохранении деталей заказа.",
                      error: { status: 500, stack: err.stack },
                    });
                  });
              }
            );
          })
          .catch((err) => {
            console.error(err);
            res.status(500).render("error", {
              message: "Ошибка сервера при расчете суммы заказа.",
              error: { status: 500, stack: err.stack },
            });
          });
      }
    );
  } catch (error) {
    console.error(error);
    res.render("error", {
      message: "Ошибка сервера.",
      error: { status: 500, stack: error.stack },
    });
  }
});
module.exports=router;
