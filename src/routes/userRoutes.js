const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const userController = require("../controllers/userController");

// GET ALL USERS
router.get(
  "/",
  auth,
  role(1),
  userController.getUsers
);

// GET USER BY ID
router.get(
  "/:id",
  auth,
  role(1),
  userController.getUserById
);

// CREATE USER
router.post(
  "/",
  auth,
  role(1),
  userController.createUser
);

// UPDATE USER
router.put(
  "/:id",
  auth,
  role(1),
  userController.updateUser
);

// DELETE USER
router.delete(
  "/:id",
  auth,
  role(1),
  userController.deleteUser
);

module.exports = router;