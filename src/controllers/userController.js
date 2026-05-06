const db = require("../config/db");
const bcrypt = require("bcrypt");

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username FROM users ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username FROM users WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE USER
exports.createUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users(username, password)
       VALUES($1, $2)
       RETURNING id, username`,
      [username, hashedPassword]
    );

    res.status(201).json({
      message: "User berhasil dibuat",
      data: result.rows[0],
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const { username } = req.body;

  try {
    const result = await db.query(
      `UPDATE users
       SET username = $1
       WHERE id = $2
       RETURNING id, username`,
      [username, req.params.id]
    );

    res.json({
      message: "User berhasil diupdate",
      data: result.rows[0],
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM users WHERE id = $1",
      [req.params.id]
    );

    res.json({
      message: "User berhasil dihapus",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};