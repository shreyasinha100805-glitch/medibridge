// ================== db.js ==================
const mysql = require("mysql2");

// Create connection pool (better for production)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
});
waitForConnections: true;
connectionLimit: 10;
queueLimit: 0;

// Promise version (for async/await)
const promiseDb = db.promise();

// Test connection
promiseDb.getConnection()
    .then(connection => {
        console.log("Connected to Railway MySQL ✅");
        connection.release();
    })
    .catch(err => {
        console.error("Database connection failed ❌", err);
    });

module.exports = promiseDb;