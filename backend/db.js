// ================== db.js ==================
const mysql = require("mysql2");

// Create connection pool (better than single connection)
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "medibridge",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use promise version (important for async/await)
const promiseDb = db.promise();

// Test connection
promiseDb.getConnection()
    .then(connection => {
        console.log("Connected to MySQL ✅");
        connection.release();
    })
    .catch(err => {
        console.error("Database connection failed ❌", err);
    });

module.exports = promiseDb;