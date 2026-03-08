// ===============================
// REGISTER USER
// ===============================
async function register() {

    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-pass").value.trim();
    const role = document.getElementById("reg-role").value;

    if (!username || !email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    try {

        const res = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                email,
                password,
                role
            })
        });

        const data = await res.json();

        if (data.message !== "User created") {
            alert(data.message);
            return;
        }

        alert("Registration successful!");
        window.location.href = "login.html";

    } catch (err) {
        alert("Server not running!");
    }
}



// ===============================
// LOGIN USER
// ===============================
async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:3000/login", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email,
            password
        })

    });

    const data = await res.json();

    if (!data.token) {
        alert(data.message);
        return;
    }

    // SAVE LOGIN DATA
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);

    window.location.href = "dashboard.html";
}


// ===============================
// ADD MEDICINE
// ===============================
async function addMedicine() {

    const name = document.getElementById("medName").value;
    const time = document.getElementById("medTime").value;
    const category = "Tablet";

    const user_id = localStorage.getItem("userId");

    if (!name || !time) {
        alert("Enter medicine name and time");
        return;
    }

    const res = await fetch("http://localhost:3000/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id,
            name,
            time,
            category
        })
    });

    const data = await res.json();

    alert(data.message);

    loadMedicines();
}



// ===============================
// LOAD MEDICINES (PATIENT)
// ===============================
async function loadMedicines() {

    const userId = localStorage.getItem("userId");

    const container = document.getElementById("medicineList");

    if (!container) return;

    const res = await fetch(`http://localhost:3000/medicines/${userId}`);
    const meds = await res.json();

    container.innerHTML = "";

    meds.forEach(m => {

        const div = document.createElement("div");

        div.innerHTML = `
            <b>${m.name}</b> - ${m.time}
            ${m.taken ? "✅ Taken" : `<button onclick="markTaken(${m.id})">Mark Taken</button>`}
        `;

        container.appendChild(div);

    });

}



// ===============================
// MARK MEDICINE TAKEN
// ===============================
async function markTaken(id) {

    await fetch(`http://localhost:3000/medicines/${id}/taken`, {
        method: "PUT"
    });

    loadMedicines();

}



// ===============================
// CARETAKER DASHBOARD
// ===============================
async function loadPatients() {

    const caretakerId = localStorage.getItem("userId");

    const container = document.getElementById("patients");

    if (!container) return;

    const res = await fetch(`http://localhost:3000/caretaker/patients/${caretakerId}`);
    const patients = await res.json();

    container.innerHTML = "";

    patients.forEach(p => {

        const div = document.createElement("div");

        div.innerHTML = `
            <b>${p.username}</b>
            <button onclick="viewMedicines(${p.id})">View Medicines</button>
        `;

        container.appendChild(div);

    });

}



// ===============================
// VIEW PATIENT MEDICINES
// ===============================
async function viewMedicines(patientId) {

    const container = document.getElementById("patientMedicines");

    if (!container) return;

    const res = await fetch(`http://localhost:3000/caretaker/medicines/${patientId}`);
    const meds = await res.json();

    container.innerHTML = "";

    meds.forEach(m => {

        const div = document.createElement("div");

        div.innerHTML = `${m.name} - ${m.time} ${m.taken ? "✅" : "❌"}`;

        container.appendChild(div);

    });

}



// ===============================
// LOGOUT
// ===============================
function logout() {

    localStorage.clear();
    window.location.href = "login.html";

}



// ===============================
// AUTO LOAD WHEN PAGE OPENS
// ===============================
window.onload = function () {

    if (document.getElementById("medicineList")) {
        loadMedicines();
    }

    if (document.getElementById("patients")) {
        loadPatients();
    }

};
