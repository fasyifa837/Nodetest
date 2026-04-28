const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const db = require("../config/db");

// GET MENU BY ROLE
router.get("/", auth, async (req, res) => {
  try {
    const role_id = req.user.role_id;

    let result;

    if (role_id === 1) {
      result = await db.query(`SELECT * FROM menus ORDER BY menu_order`);
    } else {
      result = await db.query(
        `SELECT m.*
         FROM menus m
         JOIN role_menus rm ON rm.menu_id = m.id
         WHERE rm.role_id = $1
         ORDER BY m.menu_order`,
        [role_id]
      );
    }

    const tree = buildTree(result.rows);

    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
function buildTree(list) {
  const map = {};
  const roots = [];

  // 1. buat map semua menu
  list.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  // 2. susun parent-child
  list.forEach(item => {
    if (item.parent_id) {
      if (map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      }
    } else {
      roots.push(map[item.id]);
    }
  });

  return roots;
}

module.exports = router;