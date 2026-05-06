const express = require("express");
const app = express();
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());

db.connect()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/menus", menuRoutes);

app.use("/users", userRoutes);


module.exports = app;