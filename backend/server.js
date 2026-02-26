// =======================
// MediBridge Backend Server
// =======================

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// CONFIG
// =======================
const JWT_SECRET = "medibridge_secret_key";

// =======================
// DATABASE
// =======================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "medibridge_1"
});

db.connect(err => {
    if (err) throw err;
    console.log("DB connected ✅");
});

// =======================
// JWT MIDDLEWARE
// =======================
function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(403).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    jwt.verify(token, "MEDIBRIDGE_SECRET_123", (err, decoded) => {

        if (err) {
            console.log("JWT Error:", err.message); // Debug
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = decoded;
        next();
    });
}

// =======================
// SIGNUP (MATCHES DB)
// =======================
app.post("/signup", async (req, res) => {

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "All fields required" });
    }

    db.query(
        "SELECT id FROM users WHERE email=?",
        [email],
        async (err, rows) => {

            if (err) return res.status(500).json(err);

            if (rows.length > 0)
                return res.status(400).json({ message: "User already exists" });

            const hash = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                [username, email, hash, role],
                (err) => {

                    if (err) return res.status(500).json(err);

                    res.json({ message: "User registered successfully ✅" });
                }
            );
        }
    );
});
// =======================
// LOGIN (MATCHES DB)
// =======================
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: "Missing fields" });

    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async (err, rows) => {

            if (err) return res.status(500).json(err);

            if (rows.length === 0)
                return res.status(400).json({ message: "User not found" });

            const user = rows[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match)
                return res.status(400).json({ message: "Wrong password" });

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    email: user.email
                },
                "MEDIBRIDGE_SECRET_123", // 🔥 SAME everywhere
                { expiresIn: "1h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
    );
});

// =======================
// ADD MEDICINE
// =======================
app.post("/medicines", verifyToken, (req, res) => {

    if (req.user.role !== "Patient")
        return res.status(403).json({ message: "Only patients allowed" });

    const { name, time, category } = req.body;

    if (!name || !time || !category)
        return res.status(400).json({ message: "All fields required" });

    db.query(
        "INSERT INTO medicines (user_id,name,time,category,taken) VALUES (?,?,?,?,0)",
        [req.user.id, name, time, category],
        err => {

            if (err) return res.status(500).json(err);

            res.json({ message: "Medicine added ✅" });
        }
    );
});

// =======================
// GET MEDICINES
// =======================
app.get("/medicines", verifyToken, (req, res) => {

    let sql, values = [];

    if (req.user.role === "Caretaker") {
        sql = "SELECT * FROM medicines";
    } else {
        sql = "SELECT * FROM medicines WHERE user_id=?";
        values = [req.user.id];
    }

    db.query(sql, values, (err, rows) => {

        if (err) return res.status(500).json(err);

        res.json(rows);
    });
});

// =======================
// GET TAKEN MEDICINES (CARETAKER)
// =======================
app.get("/caretaker/taken", verifyToken, (req, res) => {

    if (req.user.role !== "Caretaker") {
        return res.status(403).json({ message: "Not allowed" });
    }

    db.query(
        "SELECT * FROM medicines WHERE taken = 1",
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

// =======================
// MARK MEDICINE AS TAKEN
// =======================
app.put('/medicines/:id/taken', verifyToken, (req, res) => {

    const medicineId = req.params.id;
    const userId = req.user.id;

    const sql = `
        UPDATE medicines
        SET taken = 1,
            taken_date = CURDATE()
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [medicineId, userId], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        res.json({ message: "Medicine marked as taken ✅" });
    });
});
// =======================
// DELETE MEDICINE
// =======================
app.delete("/medicines/:id", verifyToken, (req, res) => {

    db.query(
        "DELETE FROM medicines WHERE id=? AND user_id=?",
        [req.params.id, req.user.id],
        err => {

            if (err) return res.status(500).json(err);

            res.json({ message: "Deleted ✅" });
        }
    );
});

app.get("/caretaker/patients", verifyToken, (req, res) => {

    if (req.user.role !== "Caretaker")
        return res.status(403).json({ message: "Access denied" });

    db.query(
        "SELECT id, email FROM users WHERE caretaker_id=?",
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

app.get("/caretaker/patient/:id", verifyToken, (req, res) => {

    if (req.user.role !== "Caretaker")
        return res.status(403).json({ message: "Access denied" });

    db.query(
        "SELECT * FROM medicines WHERE user_id=?",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

// =======================
// CRON REMINDER
// =======================
cron.schedule("* * * * *", () => {

    db.query(
        "SELECT * FROM medicines WHERE taken=0",
        (err, rows) => {

            if (err) return console.error(err);

            rows.forEach(m => {
                console.log(`🔔 Reminder triggered for ${med.name}`);
            });
        }
    );
});

console.log("Reminder system started ⏰");

// =======================
// ROOT
// =======================
app.get("/", (req, res) => {
    res.send("Welcome to MediBridge API 🚀");
});

// =======================
// START SERVER
// =======================
app.listen(3000, () => {
    console.log("Server running on port 3000 🚀");
});