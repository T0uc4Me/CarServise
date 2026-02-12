const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.post("/", async (req, res) => {
  try {
    const { inventory_name, quantity_in_stock, inventory_price } = req.body;
    const employes_employes_id = req.session.userId; // Получаем ID сотрудника из сессии

    // Добавляем новый товар в инвентарь
    db.run(
        "INSERT INTO Inventory (inventory_name, quantity_in_stock, inventory_price, Employes_employes_id) VALUES (?, ?, ?, ?)",
        [
          inventory_name,
          quantity_in_stock,
          inventory_price,
          employes_employes_id,
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).send("Ошибка сервера");
          }
          res.redirect("/admin");
        }
      );
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = router;
