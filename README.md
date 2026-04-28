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

### STEP — TEST powershell

```powershell id="test1"
Invoke-RestMethod -Uri "http://localhost:3000/menus" `
-Method GET `
-Headers @{ "Authorization" = "Bearer TOKEN_KAMU" }
```
