// const mysql = require("mysql2");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

const userRoutes = require("./routes/user");
const pool = require("./config/database");

// menguji koneksi
pool.getConnection((err, conn) => {
  if (err) throw err;
  console.log("Terhubung ke MySQL");
  conn.release();
});

// parse aplikasi/json
app.use(bodyParser.json());

// menjalankan server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

app.use("/user", userRoutes);


