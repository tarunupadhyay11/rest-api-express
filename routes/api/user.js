var express = require("express");
const UserController = require("../../controllers/api/UserController");

var router = express.Router();


router.get("/detail", UserController.detail);
router.put("/update", UserController.update);
router.put("/change-password", UserController.changePassword);
router.put("/update-image", UserController.updateImage);

module.exports = router;