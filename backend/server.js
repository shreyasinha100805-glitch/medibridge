/// =======================
/// MediBridge Backend Server
/// =======================

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


/// =======================
/// DATABASE
/// =======================

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.query("SELECT NOW()")
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Database Error:", err));


/// =======================
/// SIGNUP
/// =======================

app.post("/signup", async (req, res) => {

  const { username, email, password, role, caretaker_id } = req.body;

  if (!username || !email || !password || !role) {
    return res.json({ message: "Please fill all fields" });
  }

  try {

    const check = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users(username,email,password,role,caretaker_id)
       VALUES($1,$2,$3,$4,$5)
       RETURNING id`,
      [username, email, hash, role, caretaker_id || null]
    );

    res.json({
      message: "User created",
      userId: result.rows[0].id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }

});
/// =======================
/// LOGIN
/// =======================

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

    res.json({
      token,
      userId: user.id,
      role: user.role,
      username: user.username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }

});


/// =======================
/// ADD MEDICINE
/// =======================

app.post("/medicines", async (req, res) => {

  const { user_id, name, time, category } = req.body;

  if (!user_id || !name || !time) {
    return res.json({ message: "Please fill all fields" });
  }

  try {

    await db.query(
      `INSERT INTO medicines(user_id,name,time,category)
VALUES($1,$2,$3,$4)`,
      [user_id, name, time, category]
    );

    res.json({ message: "Medicine added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Add medicine error" });
  }

});


/// =======================
/// GET USER MEDICINES
/// =======================

app.get("/medicines/:userId", async (req, res) => {

  try {

    const result = await db.query(
      `SELECT * FROM medicines
WHERE user_id=$1
ORDER BY time`,
      [req.params.userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
  }

});


/// =======================
/// MARK MEDICINE TAKEN
/// =======================

app.put("/medicines/:id/taken", async (req, res) => {

  const id = req.params.id;

  try {

    await db.query(
      `UPDATE medicines
SET taken = true,
taken_date = CURRENT_DATE
WHERE id = $1`,
      [id]
    );

    res.json({ message: "Medicine marked as taken" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Error updating medicine" });

  }

});

/// =======================
/// DAILY REPORT
/// =======================

app.get("/report/:userId", async (req, res) => {

  try {

    const result = await db.query(
      `SELECT * FROM medicines
WHERE user_id=$1
AND taken_date=CURRENT_DATE`,
      [req.params.userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
  }

});


/// =======================
/// REMINDERS
/// =======================

app.get("/reminders/:userId", async (req, res) => {

  try {

    const result = await db.query(
      `SELECT * FROM medicines
WHERE user_id=$1
AND taken=false
AND time<=CURRENT_TIME`,
      [req.params.userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
  }

});


/// =======================
/// CARETAKER: PATIENTS
/// =======================

app.get("/caretaker/patients/:caretakerId", async (req, res) => {

  const caretakerId = req.params.caretakerId;

  const result = await db.query(
    `SELECT id, username
     FROM users
     WHERE caretaker_id = $1
     AND role = 'Patient'`,
    [caretakerId]
  );

  res.json(result.rows);

});
app.get("/caretaker/medicines/:patientId", async (req, res) => {

  try {
    const result = await db.query(
      "SELECT * FROM medicines WHERE user_id=$1 ORDER BY time",
      [req.params.patientId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching medicines" });
  }

});


/// =======================
/// CARETAKER REPORT
/// =======================

app.get("/caretaker/taken", async (req, res) => {

  try {

    const result = await db.query(
      `SELECT * FROM medicines`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});


/// =======================
/// CRON REMINDER SYSTEM
/// =======================

cron.schedule("* * * * *", async () => {

  try {

    const result = await db.query(
      "SELECT name,time FROM medicines WHERE taken=false"
    );

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    result.rows.forEach(m => {

      const medTime = m.time.toString().slice(0, 5);

      if (medTime === currentTime) {
        console.log(`💊 Reminder: ${m.name} at ${medTime}`);
      }

    });

  } catch (err) {
    console.error(err);
  }

});


/// =======================
/// ROOT
/// =======================

app.get("/", (req, res) => {
  res.send("MediBridge API Running");
});


/// =======================
/// SERVER
/// =======================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the process using that port or change PORT in backend/.env.`
    );
    process.exit(1);
  }

  console.error("❌ Server startup error:", err);
  process.exit(1);
});


// =======================
// CARETAKER: GET PATIENT MEDICINES
// =======================

app.get("/caretaker/medicines/:patientId", async (req, res) => {

  try {

    const result = await db.query(
      "SELECT * FROM medicines WHERE user_id=$1 ORDER BY time",
      [req.params.patientId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching medicines" });
  }

});
