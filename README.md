# Install atau update dlu revo ini

---

## 🗄️ STEP 2 — Buat Semua Tabel

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

## 🧪 STEP 3 — Insert Data Awal

```sql id="aq9i4l"
INSERT INTO roles (name) VALUES ('Admin'), ('Manager'), ('User');

INSERT INTO users (username, password, name)
VALUES ('admin', '123456', 'Admin Utama');
```

---

## 🔗 STEP 4 — Hubungkan User ke Role

Misalnya admin punya 2 role:

```sql id="rx0bde"
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1), (1, 2);
```

## 🧪 Testing di Postman (atau Postman)

### 👉 Login

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

### 🔄 Response kalau multi-role:

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

### 👉 Pilih Role

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

### ✅ Response:

```json
{
  "token": "JWT_TOKEN"
}
```

### STEP — TEST powershell

```powershell id="test1"
Invoke-RestMethod -Uri "http://localhost:3000/menus" `
-Method GET `
-Headers @{ "Authorization" = "Bearer TOKEN_KAMU" }
```
