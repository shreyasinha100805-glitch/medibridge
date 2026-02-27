const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "containers-us-west-xxx.railway.app",
  user: "root",
  password: "your_password",
  database: "railway",
  port: 6543
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("DB connected ✅");
  }
});

module.exports = db;