const mysql = require("mysql2");
const bodyParser = require("body-parser");
const express = require("express");
// const auth = require("basic-auth");
const app = express();

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "admin",
    database: "Photo_Sharing_Application",
  });
  
  module.exports = pool;

