const express = require("express");
const router = express.Router();
const db = require("../db/database");

// GET запрос на страницу заказа
router.get("/", async (req, res) => {
  try {
    const userId = req.session.customerId; // Получаем ID пользователя из сессии
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
    const customerId = req.session.customerId;
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

        // Если сотрудников нет, используем дефолтный ID 1 (затычка)
        const activeEmployeeId = employeeRows.length > 0 ? employeeRows[0].employes_id : 1;

        let totalAmount = 0;
        const servicePromises = [];

        if (Array.isArray(services) && services.length > 0) {
          for (const serviceId of services) {
            servicePromises.push(new Promise((resolve, reject) => {
              db.get(`SELECT servis_price, servis_name, servis_type FROM Servises WHERE servis_id = ?`, [serviceId], (err, serviceRow) => {
                if (err) return reject(err);
                if (!serviceRow) return resolve({ price: 0, id: serviceId });
                
                const servicePrice = parseFloat(serviceRow.servis_price) || 0;
                const isFuel = serviceRow.servis_type === 'Заправка' || serviceRow.servis_name.toLowerCase().includes('заправка');
                
                // Для топлива quantity - это сумма в рублях, которую мы получили с фронтенда
                // Для остальных услуг quantity - это количество штук
                const quantity = parseFloat(quantities[serviceId]) || 1;
                
                if (isFuel) {
                  // Для топлива totalAmount += quantity (потому что в инпуте рубли)
                  resolve({ price: servicePrice, id: serviceId, lineTotal: quantity, actualQuantity: quantity / servicePrice, isFuel: true });
                } else {
                  resolve({ price: servicePrice, id: serviceId, lineTotal: servicePrice * quantity, actualQuantity: quantity, isFuel: false });
                }
              });
            }));
          }
        }

        Promise.all(servicePromises)
          .then((serviceResults) => {
            totalAmount = serviceResults.reduce((sum, res) => sum + res.lineTotal, 0);

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
                for (const res of serviceResults) {
                  detailPromises.push(new Promise((resolve, reject) => {
                    db.run(
                      `INSERT INTO Servis_order_details 
                          (quantity, Servises_servis_id, Servis_orders_order_id, subtotal) 
                          VALUES (?, ?, ?, ?)`,
                      [
                        res.actualQuantity, // Для топлива это литры, для остального - штуки
                        res.id,
                        orderId,
                        res.lineTotal,
                      ],
                      function (err) {
                        if (err) return reject(err);
                        resolve();
                      }
                    );
                  }));
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
