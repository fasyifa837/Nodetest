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