/// =======================
// MediBridge Backend Server
// =======================
require("dotenv").config();


const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "medibridge_secret";

// =======================
// DATABASE
const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TEST DB
db.connect()
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("DB Error", err));

// SIGNUP
app.post("/signup", async (req, res) => {

  const { username, email, password, role } = req.body;

  try {

    const userCheck = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.json({ message: "User exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users(username,email,password,role) VALUES($1,$2,$3,$4)",
      [username, email, hash, role]
    );

    res.json({ message: "User created" });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }

});

// LOGIN
app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    const result = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "User not found" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }

});

// ADD MEDICINE
app.post("/medicines", async (req, res) => {

  const { user_id, name, time, category } = req.body;

  try {

    await db.query(
      "INSERT INTO medicines(user_id,name,time,category) VALUES($1,$2,$3,$4)",
      [user_id, name, time, category]
    );

    res.json({ message: "Medicine added ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }

});

// =======================
// GET MEDICINES
app.get("/medicines/:user", async (req, res) => {

  try {

    const result = await db.query(
      "SELECT * FROM medicines WHERE user_id=$1",
      [req.params.user]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
  }

});

// CRON REMINDER
cron.schedule("* * * * *", async () => {

  const result = await db.query(
    "SELECT * FROM medicines WHERE taken=false"
  );

  result.rows.forEach(m => {
    console.log("Reminder:", m.name);
  });

});

console.log("Reminder system started ⏰");

// =======================
// ROOT
app.get("/", (_req, res) => {
  res.send("MediBridge API Running");
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});