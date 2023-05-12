const mysql = require("mysql2");


// import pool koneksi
const pool = require("../config/database");

// import hash function
const {sha256} = require("../functions/hash"); 

// import middleware
const authMiddleware = require("../middleware/authmiddleware");

// membuat akun baru
const registerUser = (req, res) => {
  // get data
  const { name, email, password } = req.body;

  // validate input
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400).json({
      code: 400,
      message: "name, email, password harus harus text",
      data: null,
    });
  } else if (name === "" || email === "" || password === "") {
    res.status(400).json({
      code: 400,
      message: "name, email, password harus diiisi",
      data: null,
    });
  }

  // store user to database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    // email exist? kalau iya error (email sudah terpakai);
    conn.query(
      "select email from user where email=?",
      [email],
      (errEmail, resEmail) => {
        if (errEmail) {
          throw errEmail;
        }
        conn.release();

        if (resEmail.length > 0) {
          res.json({ code: 400, message: "email telah terpakai", data: null });
        } else {
          // register user
          conn.query(
            "INSERT INTO user (name, email, password) VALUES (?,?,?)",
            [name, email, sha256(password)],
            (err, results) => {
              if (err) {
                throw err;
              }
              res.json({
                code: 200,
                message: "Akun berhasil dibuat",
                data: { name, email },
              });
              conn.release();
            }
          );
        }
      }
    );
  });
};

// mendapatkan semua akun dari database
const getalldata = (req, res) => {
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }

    conn.query("SELECT * FROM user", (err, result) => {
      if (err) {
        throw err;
      }
      conn.release();

      res.json({ code: 200, message: "Data berhasil ditemukan", data: result });
    });
  });
};


// menghapus akun yang sudah terbuat
const deleteUser = (req, res) => {
  // get user id from auth middleware
  const userId = req.body.user.id;

  // delete user from database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }

    conn.query("DELETE FROM user WHERE id=?", [userId], (err, results) => {
      if (err) {
        throw err;
      }
      res.json({ code: 200, message: "Akun berhasil dihapus", data: null });
      conn.release();
    });
  });
};

// post photo
const postphoto = (req, res) => {
  const { title, description, imageUrl } = req.body;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof imageUrl !== "string"
  ) {
    res.status(400).json({
      code: 400,
      message: "title, description, dan imageUrl harus berupa text",
      data: null,
    });
  } else if (title === "" || description === "" || imageUrl === "") {
    res.status(400).json({
      code: 400,
      message: "title, description, dan imageUrl harus diisi",
      data: null,
    });
  } else {
    const userId = req.body.user.id;
    pool.getConnection((err, conn) => {
      if (err) {
        throw err;
      }
      const query =
        "INSERT INTO photo (title, description, image_url, user_id) VALUES (?,?,?,?)";
      const values = [title, description, imageUrl, userId];
      conn.query(query, values, (err, result) => {
        if (err) {
          throw err;
        }
        res.json({
          code: 200,
          message: "Photo berhasil ditambahkan",
          data: { title, description, imageUrl },
        });
        conn.release();
      });
    });
  }
};

// mengubah title dan description pada foto
const edittitle = (req, res) => {
  const { title, description } = req.body;
  const photoId = req.params.id;

  // validate input
  if (typeof title !== "string" || typeof description !== "string") {
    res.status(400).json({
      code: 400,
      message: "title dan description harus berupa text",
      data: null,
    });
  } else if (title === "" || description === "") {
    res.status(400).json({
      code: 400,
      message: "title dan description harus diisi",
      data: null,
    });
  } else {
    // update photo in database
    pool.getConnection((err, conn) => {
      if (err) {
        throw err;
      }
      const query = "UPDATE photo SET title=?, description=? WHERE id=?";
      conn.query(query, [title, description, photoId], (error, result) => {
        if (error) {
          throw error;
        }
        res.json({
          code: 200,
          message: "Data berhasil diupdate",
          data: { id: photoId, title, description },
        });
        conn.release();
      });
    });
  }
};

// like photo
const likephoto = (req, res) => {
  const userId = req.body.user.id;
  const photoId = req.params.id;

  // check if photo exists
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query("SELECT * FROM photo WHERE id=?", [photoId], (err, results) => {
      if (err) {
        throw err;
      }
      if (results.length === 0) {
        // photo not found
        res.json({ code: 404, message: "Foto tidak ditemukan", data: null });
        conn.release();
      } else {
        // photo exists, check if user has already liked it
        conn.query(
          "SELECT * FROM photo_like WHERE user_id=? AND photo_id=?",
          [userId, photoId],
          (err, results) => {
            if (err) {
              throw err;
            }
            if (results.length > 0) {
              // user has already liked this photo
              res.json({
                code: 400,
                message: "Anda telah menyukai foto ini sebelumnya",
                data: null,
              });
              conn.release();
            } else {
              // user has not yet liked this photo, add like to database
              conn.query(
                "INSERT INTO photo_like (user_id, photo_id) VALUES (?,?)",
                [userId, photoId],
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  res.json({
                    code: 200,
                    message: "Anda telah menyukai foto ini",
                    data: { photoId, userId },
                  });
                  conn.release();
                }
              );
            }
          }
        );
      }
    });
  });
};

// menghapus like pada photo
const deletelike = (req, res) => {
  // get photo id from params
  const photoId = req.params.photoId;

  // get user id from auth middleware
  const userId = req.body.user.id;

  // delete like from database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query(
      "DELETE FROM photo_like WHERE user_id=? AND photo_id=?",
      [userId, photoId],
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.affectedRows === 0) {
          res.json({ code: 404, message: "Like not found", data: null });
        } else {
          res.json({ code: 200, message: "Like berhasil dihapus", data: null });
        }
        conn.release();
      }
    );
  });
}; 

// post komentar pada sebuah foto
const postcomment = (req, res) => {
  const { comment } = req.body;
  const { photoId } = req.params;
  const userId = req.body.user.id;

  // cek apakah foto ada di database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query("SELECT * FROM photo WHERE id=?", [photoId], (err, result) => {
      if (err) {
        throw err;
      }
      conn.release();

      if (result.length === 0) {
        res.json({ code: 404, message: "Foto tidak ditemukan", data: null });
      } else {
        // foto ditemukan, lakukan insert pada tabel comment
        const photo = result[0];

        pool.getConnection((err, conn) => {
          if (err) {
            throw err;
          }

          conn.query(
            "INSERT INTO comment_user (photo_id, user_id, comment) VALUES (?,?,?)",
            [photoId, userId, comment],
            (err, results) => {
              if (err) {
                throw err;
              }

              res.json({
                code: 200,
                message: "Komentar berhasil ditambahkan",
                data: { comment, user_id: userId, photo_id: photoId },
              });
              conn.release();
            }
          );
        });
      }
    });
  });
};

// update komentar pada sebuah foto
const updatecomment = (req, res) => {
  const { comment } = req.body;
  const { photoId, commentId } = req.params;
  const userId = req.body.user.id;

  // cek apakah foto dan komentar ada di database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query("SELECT * FROM photo WHERE id=?", [photoId], (err, result) => {
      if (err) {
        throw err;
      }
      if (result.length === 0) {
        conn.release();
        res.json({ code: 404, message: "Foto tidak ditemukan", data: null });
      } else {
        conn.query("SELECT * FROM comment_user WHERE id=?", [commentId], (err, result) => {
          if (err) {
            throw err;
          }
          conn.release();

          if (result.length === 0) {
            res.json({ code: 404, message: "Komentar tidak ditemukan", data: null });
          } else {
            const commentData = result[0];
            if (commentData.user_id !== userId) {
              res.json({ code: 401, message: "Anda tidak memiliki akses untuk mengubah komentar ini", data: null });
            } else {
              // foto dan komentar ditemukan, lakukan update pada tabel comment_user
              pool.getConnection((err, conn) => {
                if (err) {
                  throw err;
                }

                conn.query(
                  "UPDATE comment_user SET comment=? WHERE id=?",
                  [comment, commentId],
                  (err, results) => {
                    if (err) {
                      throw err;
                    }

                    res.json({
                      code: 200,
                      message: "Komentar berhasil diupdate",
                      data: { comment, user_id: userId, photo_id: photoId },
                    });
                    conn.release();
                  }
                );
              });
            }
          }
        });
      }
    });
  });
};

// delete komentar pada sebuah foto
const deletecomment = (req, res) => {
  const { photoId, commentId } = req.params;
  const userId = req.body.user.id;

  // cek apakah foto dan komentar ada di database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query("SELECT * FROM photo WHERE id=?", [photoId], (err, result) => {
      if (err) {
        throw err;
      }
      if (result.length === 0) {
        conn.release();
        res.json({ code: 404, message: "Foto tidak ditemukan", data: null });
      } else {
        conn.query("SELECT * FROM comment_user WHERE id=?", [commentId], (err, result) => {
          if (err) {
            throw err;
          }
          conn.release();

          if (result.length === 0) {
            res.json({ code: 404, message: "Komentar tidak ditemukan", data: null });
          } else {
            const commentData = result[0];
            if (commentData.user_id !== userId) {
              res.json({ code: 401, message: "Anda tidak memiliki akses untuk menghapus komentar ini", data: null });
            } else {
              // foto dan komentar ditemukan, lakukan delete pada tabel comment_user
              pool.getConnection((err, conn) => {
                if (err) {
                  throw err;
                }

                conn.query(
                  "DELETE FROM comment_user WHERE id=?",
                  [commentId],
                  (err, results) => {
                    if (err) {
                      throw err;
                    }

                    res.json({
                      code: 200,
                      message: "Komentar berhasil dihapus",
                      data: { user_id: userId, photo_id: photoId },
                    });
                    conn.release();
                  }
                );
              });
            }
          }
        });
      }
    });
  });
};

// menghapus foto
const deletephoto = (req, res) => {
  // get user id from auth middleware
  const userId = req.body.user.id;
  const photoId = req.params.id;

  // delete photo from database
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    conn.query("SELECT * FROM photo WHERE id=?", [photoId], (err, result) => {
      if (err) {
        throw err;
      }
      if (result.length === 0) {
        return res.json({ code: 404, message: "Photo not found", data: null });
      }
      if (result[0].user_id !== userId) {
        return res.json({ code: 401, message: "Unauthorized", data: null });
      }

      conn.query("DELETE FROM photo WHERE id=?", [photoId], (err, results) => {
        if (err) {
          throw err;
        }
        res.json({ code: 200, message: "Photo berhasil dihapus", data: null });
        conn.release();
      });
    });
  });
};

module.exports = {
  authMiddleware,
  registerUser,
  getalldata,
  deleteUser,
  postphoto,
  edittitle,
  likephoto,
  deletelike,
  postcomment,
  updatecomment,
  deletecomment,
  deletephoto,



  
  
  };