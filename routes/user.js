const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// import middleware authMiddleware
const { authMiddleware } = require("../middleware/authmiddleware");

// membuat akun baru
router.post("/register", userController.registerUser);

// mendapatkan semua database
router.get("/data", userController.getalldata);

// menghapus akun yang sudah terbuat
router.delete("/delete-account", authMiddleware, userController.deleteUser);

// post foto
router.post("/photo", authMiddleware, userController.postphoto);

// mengubah title dan description pada foto
router.put("/photo/:id", authMiddleware, userController.edittitle);

// like foto
router.post("/like-photo/:id", authMiddleware, userController.likephoto);

// menghapus like pada photo
router.delete("/photo/:photoId/like", authMiddleware, userController.deletelike);

// post komentar pada sebuah foto
router.post("/photo/:photoId/comment", authMiddleware, userController.postcomment);

// update komentar pada sebuah foto
router.put("/photo/:photoId/comment/:commentId", authMiddleware, userController.updatecomment);

// delete komentar pada sebuah foto
router.delete("/photo/:photoId/comment/:commentId", authMiddleware, userController.deletecomment);

// menghapus foto
router.delete("/photo/:id", authMiddleware, userController.deletephoto);



module.exports = router;
