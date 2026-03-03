const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Таблица создаётся в db/database.js при старте

function requireUser(req, res, next) {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "Необходима авторизация" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.adminId || req.session.adminRole !== "admin") {
    return res.status(403).json({ error: "Доступ запрещён" });
  }
  next();
}

// GET /chat/messages — сообщения пользователя (polling)
router.get("/messages", requireUser, (req, res) => {
  const customerId = req.session.customerId;
  const since = parseInt(req.query.since) || 0;

  db.all(
    "SELECT * FROM chat_messages WHERE customer_id = ? AND id > ? ORDER BY created_at ASC",
    [customerId, since],
    (err, rows) => {
      if (err) {
        console.error("[chat/messages]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json(rows || []);
    }
  );
});

// POST /chat/send — пользователь отправляет сообщение
router.post("/send", requireUser, (req, res) => {
  const customerId = req.session.customerId;
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Пустое сообщение" });
  }

  db.run(
    "INSERT INTO chat_messages (customer_id, sender, message) VALUES (?, 'user', ?)",
    [customerId, String(message).trim()],
    function (err) {
      if (err) {
        console.error("[chat/send]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ id: this.lastID, message: String(message).trim(), sender: "user" });
    }
  );
});

// GET /chat/unread-count
router.get("/unread-count", requireUser, (req, res) => {
  const customerId = req.session.customerId;
  db.get(
    "SELECT COUNT(*) as count FROM chat_messages WHERE customer_id = ? AND sender = 'admin' AND is_read = 0",
    [customerId],
    (err, row) => {
      if (err) {
        console.error("[chat/unread-count]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ count: row ? row.count : 0 });
    }
  );
});

// POST /chat/read — отметить как прочитанные
router.post("/read", requireUser, (req, res) => {
  const customerId = req.session.customerId;
  db.run(
    "UPDATE chat_messages SET is_read = 1 WHERE customer_id = ? AND sender = 'admin'",
    [customerId],
    (err) => {
      if (err) {
        console.error("[chat/read]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ ok: true });
    }
  );
});

// ===== ADMIN =====

// GET /chat/admin/users — пользователи с историей чата
router.get("/admin/users", requireAdmin, (req, res) => {
  db.all(
    `SELECT 
       c.customer_id, c.first_name, c.last_name, c.phone, c.email,
       (SELECT message FROM chat_messages WHERE customer_id = c.customer_id ORDER BY id DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM chat_messages WHERE customer_id = c.customer_id ORDER BY id DESC LIMIT 1) AS last_time,
       (SELECT COUNT(*) FROM chat_messages WHERE customer_id = c.customer_id AND sender = 'user' AND is_read = 0) AS unread_count
     FROM Customers c
     WHERE EXISTS (SELECT 1 FROM chat_messages WHERE customer_id = c.customer_id)
     ORDER BY last_time DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("[chat/admin/users]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json(rows || []);
    }
  );
});

// GET /chat/admin/messages/:customerId — история переписки
router.get("/admin/messages/:customerId", requireAdmin, (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const since = parseInt(req.query.since) || 0;
  if (isNaN(customerId)) return res.status(400).json({ error: "Неверный ID" });

  db.all(
    "SELECT * FROM chat_messages WHERE customer_id = ? AND id > ? ORDER BY created_at ASC",
    [customerId, since],
    (err, rows) => {
      if (err) {
        console.error("[chat/admin/messages]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      // Отмечаем сообщения пользователя прочитанными
      db.run(
        "UPDATE chat_messages SET is_read = 1 WHERE customer_id = ? AND sender = 'user'",
        [customerId]
      );
      res.json(rows || []);
    }
  );
});

// POST /chat/admin/send/:customerId — ответ администратора
router.post("/admin/send/:customerId", requireAdmin, (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const { message } = req.body;
  if (isNaN(customerId)) return res.status(400).json({ error: "Неверный ID" });

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Пустое сообщение" });
  }

  db.run(
    "INSERT INTO chat_messages (customer_id, sender, message) VALUES (?, 'admin', ?)",
    [customerId, String(message).trim()],
    function (err) {
      if (err) {
        console.error("[chat/admin/send]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ id: this.lastID, message: String(message).trim(), sender: "admin" });
    }
  );
});

// DELETE /chat/admin/delete/:customerId — удаление истории чата
router.delete("/admin/delete/:customerId", requireAdmin, (req, res) => {
  const customerId = parseInt(req.params.customerId);
  if (isNaN(customerId)) return res.status(400).json({ error: "Неверный ID" });

  db.run("DELETE FROM chat_messages WHERE customer_id = ?", [customerId], function (err) {
    if (err) {
      console.error("[chat/admin/delete]", err.message);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
    res.json({ ok: true });
  });
});

// GET /chat/admin/total-unread
router.get("/admin/total-unread", requireAdmin, (req, res) => {
  db.get(
    "SELECT COUNT(*) as count FROM chat_messages WHERE sender = 'user' AND is_read = 0",
    [],
    (err, row) => {
      if (err) {
        console.error("[chat/admin/total-unread]", err.message);
        return res.status(500).json({ error: "Ошибка сервера" });
      }
      res.json({ count: row ? row.count : 0 });
    }
  );
});

module.exports = router;
