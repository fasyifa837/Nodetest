const db = require("../config/db");

// GET MENUS
exports.getMenus = async (req, res) => {
  try {

    const result = await db.query(
      "SELECT * FROM menus ORDER BY menu_order"
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// CREATE MENU
exports.createMenu = async (req, res) => {
  const {
    name,
    path,
    parent_id,
    menu_order
  } = req.body;

  try {

    const result = await db.query(
      `INSERT INTO menus
      (name, path, parent_id, menu_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [name, path, parent_id, menu_order]
    );

    res.status(201).json({
      message: "Menu berhasil dibuat",
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// UPDATE MENU
exports.updateMenu = async (req, res) => {

  const {
    name,
    path,
    parent_id,
    menu_order
  } = req.body;

  try {

    const result = await db.query(
      `UPDATE menus
       SET
       name = $1,
       path = $2,
       parent_id = $3,
       menu_order = $4
       WHERE id = $5
       RETURNING *`,
      [
        name,
        path,
        parent_id,
        menu_order,
        req.params.id
      ]
    );

    res.json({
      message: "Menu berhasil diupdate",
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// DELETE MENU
exports.deleteMenu = async (req, res) => {

  try {

    await db.query(
      "DELETE FROM menus WHERE id = $1",
      [req.params.id]
    );

    res.json({
      message: "Menu berhasil dihapus"
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};