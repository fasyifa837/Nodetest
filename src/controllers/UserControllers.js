const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    const roleResult = await db.query(
      `SELECT r.name 
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = roleResult.rows.map(r => r.name);

    const token = jwt.sign(
      { id: user.id, username: user.username, roles },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE USER
exports.createUser = async (req, res) => {
  const { username, password, roles = [] } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const hashed = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, hashed]
    );

    const user = userResult.rows[0];

    for (let roleId of roles) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [user.id, roleId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(user);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username,
      COALESCE(json_agg(r.name) FILTER (WHERE r.id IS NOT NULL), '[]') as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT u.id, u.username,
      COALESCE(json_agg(r.name) FILTER (WHERE r.id IS NOT NULL), '[]') as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, roles = [] } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let query = `UPDATE users SET username = $1`;
    let values = [username];
    let idx = 2;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += `, password = $${idx}`;
      values.push(hashed);
      idx++;
    }

    query += ` WHERE id = $${idx} RETURNING id, username`;
    values.push(id);

    const result = await client.query(query, values);

    await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);

    for (let roleId of roles) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [id, roleId]
      );
    }

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);

    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
