// ================== medicine.js ==================

// ================== AUTH CHECK ==================
const token = localStorage.getItem("token");
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (!token || !loggedInUser) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
}

// ================== LANGUAGE ==================
let currentLang = "en";

const translations = {
    en: {
        noMeds: "No medicines added yet.",
        fillAll: "Please enter medicine name and time",
        taken: "Taken",
        undo: "Undo",
        delete: "Delete",
        tabletReminder: "Next medicine:",
        notify: "Notification sent to caretaker!"
    },
    bn: {
        noMeds: "কোনও ঔষধ যোগ করা হয়নি।",
        fillAll: "অনুগ্রহ করে ঔষধের নাম এবং সময় লিখুন",
        taken: "নেওয়া হয়েছে",
        undo: "পুনরায়",
        delete: "মুছুন",
        tabletReminder: "পরবর্তী ঔষধ:",
        notify: "হেল্পারকে নোটিফিকেশন পাঠানো হয়েছে!"
    },
    hi: {
        noMeds: "कोई दवा अभी तक नहीं जोड़ी गई।",
        fillAll: "कृपया दवा का नाम और समय दर्ज करें",
        taken: "ली गई",
        undo: "पूर्ववत",
        delete: "हटाएँ",
        tabletReminder: "अगली दवा:",
        notify: "देखभालकर्ता को सूचना भेजी गई!"
    }
};

// ================== ROLE UI SETUP ==================
document.getElementById("welcome").innerText =
    "Welcome, " + loggedInUser.username;

document.getElementById("role").innerText =
    "You are logged in as: " + loggedInUser.role;

if (loggedInUser.role === "Patient") {
    document.getElementById("patient-panel").style.display = "block";
    document.getElementById("caretaker-panel").style.display = "none";
} else {
    document.getElementById("patient-panel").style.display = "none";
    document.getElementById("caretaker-panel").style.display = "block";
}

// ================== FETCH MEDICINES ==================
async function getMedicines() {
    try {
        const res = await fetch("http://localhost:3000/medicines", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch medicines");

        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ================== ADD MEDICINE ==================
async function addMed() {
    if (loggedInUser.role !== "Patient") {
        alert("Only patients can add medicines.");
        return;
    }

    const name = document.getElementById("med-name").value.trim();
    const time = document.getElementById("med-time").value;

    if (!name || !time) {
        alert(translations[currentLang].fillAll);
        return;
    }

    await fetch("http://localhost:3000/medicines", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, time })
    });

    document.getElementById("med-name").value = "";
    document.getElementById("med-time").value = "";

    display();
}

// ================== TOGGLE TAKEN ==================
async function toggleTaken(medId, currentTaken) {
    await fetch(`http://localhost:3000/medicines/${medId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ taken: !currentTaken })
    });

    display();
    showNotification(translations[currentLang].notify);
}

// ================== DELETE MEDICINE ==================
async function deleteMed(medId) {
    await fetch(`http://localhost:3000/medicines/${medId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    display();
}

// ================== DISPLAY ==================
async function display() {

    const medList = document.getElementById("med-list");
    const caretakerList = document.getElementById("caretaker-list");
    const tabletReminder = document.getElementById("tablet-reminder");

    medList.innerHTML = "";
    caretakerList.innerHTML = "";
    tabletReminder.innerHTML = "";

    const meds = await getMedicines();

    if (!meds.length) {
        if (loggedInUser.role === "Patient") {
            medList.innerHTML = `<p>${translations[currentLang].noMeds}</p>`;
        }
        return;
    }

    let nextMed = null;

    meds.forEach(med => {

        // ================== PATIENT VIEW ==================
        if (loggedInUser.role === "Patient") {

            const li = document.createElement("li");
            li.className = med.taken ? "taken" : "not-taken";

            li.innerHTML = `
                ${med.name} - ${med.time}
                <div>
                    <button onclick="toggleTaken(${med.id}, ${med.taken})">
                        ${med.taken ? translations[currentLang].undo : translations[currentLang].taken}
                    </button>
                    <button onclick="deleteMed(${med.id})">
                        ${translations[currentLang].delete}
                    </button>
                </div>
            `;

            medList.appendChild(li);

            if (!med.taken && !nextMed) nextMed = med;
        }

        // ================== CARETAKER VIEW ==================
        if (loggedInUser.role === "Caretaker" && med.taken) {
            const li = document.createElement("li");
            li.textContent =
                `${med.patient_email || med.user_id} took ${med.name} at ${med.time}`;
            caretakerList.appendChild(li);
        }

    });

    if (nextMed) {
        tabletReminder.innerHTML =
            `${translations[currentLang].tabletReminder} ${nextMed.name} at ${nextMed.time}`;
    }
}

// ================== LANGUAGE CHANGE ==================
function changeLanguage(lang) {
    currentLang = lang;
    display();
}

// ================== NOTIFICATION ==================
function showNotification(msg) {
    let notification = document.getElementById("notification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "notification";
        notification.style.background = "#28a745";
        notification.style.color = "white";
        notification.style.padding = "10px";
        notification.style.textAlign = "center";
        document.body.prepend(notification);
    }

    notification.textContent = msg;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

// ================== HOSPITAL FINDER ==================
function findHospital() {
    window.open(
        "https://www.google.com/maps/search/hospital+near+me",
        "_blank"
    );
}

// ================== INITIAL LOAD ==================
display();