// ===============================
// REGISTER USER
// ===============================
async function register() {

    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-pass").value.trim();
    const role = document.getElementById("reg-role").value;

    if (!email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    try {

        const res = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                pass: password,
                role: role
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Registration failed");
            return;
        }

        alert("Registration successful! Please login.");
        window.location.href = "login.html";

    } catch (err) {
        alert("Server not running!");
    }
}


// ===============================
// LOGIN USER
// ===============================
async function login() {

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {

        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                pass: password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Login failed");
            return;
        }

        // ✅ Save token
        localStorage.setItem("token", data.token);

        // ✅ Save logged-in user (IMPORTANT - name must match dashboard)
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));

        alert("Login successful!");

        // Go to dashboard
        window.location.href = "dashboard.html";

    } catch (err) {
        alert("Server not running!");
    }
}