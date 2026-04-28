## Dokumentasi

npm install express dotenv jsonwebtoken bcrypt pg

npm install nodemon --save-dev

mkdir src
cd src
mkdir controllers routes models middlewares config utils
cd ..

type nul > src/app.js
type nul > src/server.js
type nul > .env

npm run dev / node hash.js ada hasil $2b$10$fk20E.N0gahAT9cV2yaFZeIxAL423ZrxuDCOAK9vF1LieSFWEWyAa

---

# 🧱 STEP 1 — Buat Database

Di dalam `psql`, jalankan:

```sql id="d1xk3c"
CREATE DATABASE auth_db;
```

---

# 🔄 Pindah ke Database

```sql id="w7d6cl"
\c auth_db
```

Kalau berhasil akan muncul:

```
You are now connected to database "auth_db"
```

---

# 🗄️ STEP 2 — Buat Semua Tabel

Copy langsung semua ini (boleh sekali paste):

```sql id="y9m3pu"
-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROLES
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  description TEXT
);

-- USER ROLES (multi role)
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE
);

-- MENUS (multi level)
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  path VARCHAR(100),
  parent_id INT REFERENCES menus(id) ON DELETE CASCADE,
  menu_order INT
);

-- ROLE MENUS
CREATE TABLE role_menus (
  id SERIAL PRIMARY KEY,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  menu_id INT REFERENCES menus(id) ON DELETE CASCADE
);
```

---

# 🧪 STEP 3 — Insert Data Awal

```sql id="aq9i4l"
INSERT INTO roles (name) VALUES ('Admin'), ('Manager'), ('User');

INSERT INTO users (username, password, name)
VALUES ('admin', '123456', 'Admin Utama');
```

---

# 🔗 STEP 4 — Hubungkan User ke Role

Misalnya admin punya 2 role:

```sql id="rx0bde"
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1), (1, 2);
```

👉 Artinya:

* user `admin` punya role **Admin & Manager**
* nanti saat login → akan diminta pilih role

---

# ✅ STEP 5 — Cek Data

```sql id="lf9m7c"
SELECT * FROM users;
SELECT * FROM roles;
SELECT * FROM user_roles;
```

---


Sekarang kita masuk ke bagian paling penting:

## 🔐 Login + JWT + Multi Role

Kita akan buat:

* endpoint login
* validasi password (bcrypt)
* ambil role user
* kalau multi role → return pilihan
* generate JWT

---

👉 Ketik aja:
**"lanjut login jwt"**




Bagus, berarti fondasi kamu sudah kuat 👍


# 🔐 STEP 1 — Hash Password (Penting!)

Sekarang password masih `"123456"` (plain text). Kita harus hash pakai **bcrypt**

## 👉 Generate hash dulu (sekali saja)

Buat file sementara: `hash.js`

```js
const bcrypt = require("bcrypt");

async function hashPassword() {
  const password = "123456";
  const hashed = await bcrypt.hash(password, 10);
  console.log(hashed);
}

hashPassword();
```

Jalankan:

```bash
node hash.js
```

Copy hasil hash (contoh):

```
$2b$10$abc123...
```

---

## 👉 Update di database

Di `psql`:

```sql
UPDATE users
SET password = 'HASIL_HASH_KAMU'
WHERE username = 'admin';
```

---

# 🔐 STEP 2 — Buat Controller Login

📄 `src/controllers/authController.js`

```js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // cek user
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = userResult.rows[0];

    // cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    // ambil roles
    const roleResult = await db.query(
      `SELECT r.id, r.name 
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = roleResult.rows;

    // kalau lebih dari 1 role
    if (roles.length > 1) {
      return res.json({
        message: "Pilih role",
        user_id: user.id,
        roles: roles,
      });
    }

    // kalau hanya 1 role → langsung login
    const token = jwt.sign(
      {
        user_id: user.id,
        role_id: roles[0].id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
```

---

# 🔐 STEP 3 — Endpoint Pilih Role

Tambahkan di file yang sama:

```js
exports.selectRole = async (req, res) => {
  const { user_id, role_id } = req.body;

  try {
    const token = jwt.sign(
      { user_id, role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
```

---

# 🌐 STEP 4 — Routes

📄 `src/routes/authRoutes.js`

```js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/select-role", authController.selectRole);

module.exports = router;
```

---

# 🔌 STEP 5 — Hubungkan ke app.js

📄 `src/app.js`

```js
const express = require("express");
const app = express();
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

app.use(express.json());

db.connect()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
```

---

# 🧪 STEP 6 — Testing di Postman (atau Postman)

## 👉 Login

**POST**

```
http://localhost:3000/auth/login
```

Body JSON:

```json
{
  "username": "admin",
  "password": "123456"
}
```

---

## 🔄 Response kalau multi-role:

```json
{
  "message": "Pilih role",
  "user_id": 1,
  "roles": [
    { "id": 1, "name": "Admin" },
    { "id": 2, "name": "Manager" }
  ]
}
```

---

## 👉 Pilih Role

**POST**

```
http://localhost:3000/auth/select-role
```

```json
{
  "user_id": 1,
  "role_id": 1
}
```

---

## ✅ Response:

```json
{
  "token": "JWT_TOKEN"
}
```

---

# 🎉 Sampai sini kamu sudah berhasil:

✔ Login system
✔ Password aman (bcrypt)
✔ Multi-role support
✔ JWT authentication

---


Kamu sudah punya:

users
roles
user_roles
menus (hierarchy)
role_menus

✔ SUDAH ADA DASARNYA

Yang sudah ada:

POST /auth/login
POST /auth/select-role
GET /menus

## 1. Role belum punya menu

Cek tabel ini di PostgreSQL:

```sql id="chk1"
SELECT * FROM role_menus;
```

Kalau kosong → INI PENYEBABNYA

---

## 2. Menu belum dibuat

```sql id="chk2"
SELECT * FROM menus;
```

---

## 3. Query join tidak menemukan data

Karena ini query kamu:

```sql id="qry1"
SELECT m.*
FROM menus m
JOIN role_menus rm ON rm.menu_id = m.id
WHERE rm.role_id = $1;
```

👉 Kalau `role_menus` kosong → hasilnya kosong

---

# 🔥 SOLUSI CEPAT (WAJIB DILAKUKAN)

## STEP 1 — Buat menu dulu

Di PostgreSQL:

```sql id="fix1"
INSERT INTO menus (name, path, parent_id, menu_order)
VALUES 
('Dashboard', '/dashboard', NULL, 1),
('Master User', '/users', NULL, 2);
```

---

## STEP 2 — Assign ke role

```sql id="fix2"
INSERT INTO role_menus (role_id, menu_id)
VALUES 
(1, 1),
(1, 2);
```

---

## STEP 3 — TEST ULANG

```powershell id="test1"
Invoke-RestMethod -Uri "http://localhost:3000/menus" `
-Method GET `
-Headers @{ "Authorization" = "Bearer TOKEN_KAMU" }
```

---

# 🎯 HASIL YANG DIHARAPKAN

```json id="ok1"
[
  {
    "id": 1,
    "name": "Dashboard"
  },
  {
    "id": 2,
    "name": "Master User"
  }
]
```
