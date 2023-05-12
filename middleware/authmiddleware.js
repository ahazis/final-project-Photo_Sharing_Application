const mysql = require("mysql2");
const auth = require("basic-auth");


// import pool koneksi
const pool = require("../config/database");


// import hash function
const {sha256} = require("../functions/hash");
  

// authMiddleware
const authMiddleware = (req, res, next) => {
    const user = auth(req);
  
    // username & pass is required
    if (typeof user === "undefined") {
      return res.json({ code: 401, message: "token is not defined", data: null });
    }
  
    // check data user in database
    pool.getConnection((err, conn) => {
      if (err) {
        throw err;
      }
      conn.query(
        "select id, email from user where email=? and password=?",
        [user.name, sha256(user.pass)],
        (err, result) => {
          if (err) {
            throw err;
          }
          conn.release();
  
          if (result.length != 1) {
            // user is not found (not valid)
            return res.json({
              code: 400,
              message: "username atau password salah",
              data: null,
            });
          } else {
            // user valid, add to req
            req.body.user = result[0];
            next(); // continue to next step
            return;
          }
        }
      );
    });
  };

module.exports = {
    authMiddleware

  }