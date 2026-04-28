# Install atau update dlu revo ini

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

---

## 🎉 Sampai sini kamu sudah berhasil:

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

### 1. Role belum punya menu

Cek tabel ini di PostgreSQL:

```sql id="chk1"
SELECT * FROM role_menus;
```

Kalau kosong → INI PENYEBABNYA

---

### 2. Menu belum dibuat

```sql id="chk2"
SELECT * FROM menus;
```

---

### 3. Query join tidak menemukan data

Karena ini query kamu:

```sql id="qry1"
SELECT m.*
FROM menus m
JOIN role_menus rm ON rm.menu_id = m.id
WHERE rm.role_id = $1;
```

👉 Kalau `role_menus` kosong → hasilnya kosong

---

## 🔥 SOLUSI CEPAT (WAJIB DILAKUKAN)

### STEP 1 — Buat menu dulu

Di PostgreSQL:

```sql id="fix1"
INSERT INTO menus (name, path, parent_id, menu_order)
VALUES 
('Dashboard', '/dashboard', NULL, 1),
('Master User', '/users', NULL, 2);
```

---

### STEP 2 — Assign ke role

```sql id="fix2"
INSERT INTO role_menus (role_id, menu_id)
VALUES 
(1, 1),
(1, 2);
```

---

### STEP 3 — TEST ULANG

```powershell id="test1"
Invoke-RestMethod -Uri "http://localhost:3000/menus" `
-Method GET `
-Headers @{ "Authorization" = "Bearer TOKEN_KAMU" }
```
