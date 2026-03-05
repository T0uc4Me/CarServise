const express = require("express");
const app = express();
const PORT = 3000;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const session = require("express-session");
// Middleware для парсинга JSON
app.use(express.json());
//////////////////
app.use(
  session({
    secret: "your-secret-key", // Замените на собственный секретный ключ
    resave: false,
    saveUninitialized: false, // Don't create session until something is stored
    cookie: { 
      secure: false, 
      maxAge: 48 * 60 * 60 * 1000 // 48 hours in milliseconds
    },
  })
);
app.use((req, res, next) => {
  res.locals.error = req.session.error || null;
  res.locals.success = req.session.success || null;
  delete req.session.error;
  delete req.session.success;
  next();
});
// Подключение маршрутов
const customerRoutes = require("./routes/customers");
app.use("/customers", customerRoutes);

// const servisOrdersRoutes = require("./routes/servisorders");
// app.use("/orders", servisOrdersRoutes);

const servisPartsRoutes = require("./routes/servisparts");
app.use("/parts", servisPartsRoutes);

const paymentsRoutes = require("./routes/payments");
app.use("/payments", paymentsRoutes);

const servisOrderDetailsRoutes = require("./routes/servisorderdetails");
app.use("/servis_order_details", servisOrderDetailsRoutes);

const fuelTypesRouter = require("./routes/fueltypes");
app.use("/fueltypes", fuelTypesRouter);

const servisesRoutes = require("./routes/servises");
app.use("/servises", servisesRoutes);

const employesRouter = require("./routes/employes");
app.use("/employes", employesRouter);

const employWorkLogRouter = require("./routes/employ_work_log");
app.use("/employ_work_log", employWorkLogRouter);

const inventoryRouter = require("./routes/inventory");
app.use("/inventory", inventoryRouter);

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const zakazRouter = require("./routes/zakaz");
app.use("/zakaz", zakazRouter);

const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

const orderDetailsRouter = require("./routes/orders");
app.use("/order-details", orderDetailsRouter);

app.get("/", (req, res) => {
  const isLoggedIn = !!req.session.customerId;
  let userName = "";
  if (isLoggedIn) {
    const db = require("./db/database");
    db.get("SELECT first_name FROM Customers WHERE customer_id = ?", [req.session.customerId], (err, user) => {
      userName = user ? user.first_name : "";
      res.render("1index", { isLoggedIn, userName });
    });
  } else {
    res.render("1index", { isLoggedIn, userName });
  }
});

// Новые информационные страницы
app.get("/about", (req, res) => {
  const isLoggedIn = !!req.session.customerId;
  res.render("about", { isLoggedIn });
});

app.get("/services", (req, res) => {
  const isLoggedIn = !!req.session.customerId;
  res.render("services", { isLoggedIn });
});

app.get("/clients", (req, res) => {
  const isLoggedIn = !!req.session.customerId;
  res.render("clients", { isLoggedIn });
});

app.get("/home2", (req, res) => {
  res.redirect("/"); // Единая главная страница
});

const carRoutes = require("./routes/car");
app.use("/car", carRoutes);

const accountRouter = require("./routes/account");
app.use("/account", accountRouter);

const chatRouter = require("./routes/chat");
app.use("/chat", chatRouter);

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", require("ejs-locals"));
app.use(express.static("public"));
// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
