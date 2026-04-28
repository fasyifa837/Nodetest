const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "bambang",
  database: "auth_db",
});

module.exports = pool;