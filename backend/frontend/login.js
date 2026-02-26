// =======================
// MediBridge Login JS
// =======================

let currentLang = "en";
let mediaRecorder;
let audioChunks = [];

// -----------------------
// Multi-language translations
// -----------------------
const translations = {
    en: {
        title: "🩺 MediBridge Login",
        login: "Secure Login",
        create: "Create New Account",
        record: "🎤 Record Voice",
        find: "🏥 Find Hospital",
        fillAll: "Please fill all fields.",
        invalid: "Invalid Username or Password",
        success: "Login Successful! Redirecting..."
    },
    bn: {
        title: "🩺 মেডিব্রিজ লগইন",
        login: "নিরাপদ লগইন",
        create: "নতুন একাউন্ট তৈরি করুন",
        record: "🎤 ভয়েস রেকর্ড করুন",
        find: "🏥 হাসপাতাল খুঁজুন",
        fillAll: "সব তথ্য পূরণ করুন।",
        invalid: "অবৈধ ব্যবহারকারীর নাম বা পাসওয়ার্ড",
        success: "লগইন সফল! পুনঃনির্দেশিত হচ্ছে..."
    },
    hi: {
        title: "🩺 मेडिब्रिज लॉगिन",
        login: "सुरक्षित लॉगिन",
        create: "नया अकाउंट बनाएं",
        record: "🎤 वॉइस रिकॉर्ड करें",
        find: "🏥 अस्पताल खोजें",
        fillAll: "सभी फ़ील्ड भरें।",
        invalid: "अमान्य उपयोगकर्ता नाम या पासवर्ड",
        success: "लॉगिन सफल! रीडायरेक्ट हो रहा है..."
    }
};

// -----------------------
// Change language
// -----------------------
function changeLanguage(lang) {
    currentLang = lang;
    document.getElementById("title").innerText = translations[lang].title;
    document.getElementById("loginBtn").innerText = translations[lang].login;
    document.getElementById("createLink").innerText = translations[lang].create;
    document.getElementById("voiceBtn").innerText = translations[lang].record;
    document.getElementById("hospitalBtn").innerText = translations[lang].find;
}

// -----------------------
// Toggle password visibility
// -----------------------
function togglePassword() {
    const pass = document.getElementById("password");
    pass.type = pass.type === "password" ? "text" : "password";
}

// -----------------------
// Login function
// -----------------------
function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const messageElem = document.getElementById("error");
    const loadingElem = document.getElementById("loading");

    if (!user || !pass || !role) {
        messageElem.innerText = translations[currentLang].fillAll;
        return;
    }

    messageElem.innerText = "";
    loadingElem.style.display = "block";

    setTimeout(() => {
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const validUser = users.find(u => u.username === user && u.password === pass && u.role === role);

        loadingElem.style.display = "none";

        if (validUser || (user === "admin" && pass === "1234")) {
            localStorage.setItem("loggedIn", "true");
            messageElem.className = "success";
            messageElem.innerText = translations[currentLang].success;
            setTimeout(() => window.location.href = "dashboard.html", 1000);
        } else {
            messageElem.className = "message";
            messageElem.innerText = translations[currentLang].invalid;
        }
    }, 1000);
}

// -----------------------
// Redirect to Signup
// -----------------------
function goToSignup() {
    window.location.href = "signup.html";
}

// -----------------------
// Voice Recording
// -----------------------
async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Voice recording not supported.");
        return;
    }

    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks);
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.play();
            alert("Voice recorded and played!");
        };

        mediaRecorder.start();
        document.getElementById("voiceBtn").innerText = "⏹️ Stop Recording";
    } else {
        mediaRecorder.stop();
        document.getElementById("voiceBtn").innerText = translations[currentLang].record;
    }
}

// -----------------------
// Hospital Finder
// -----------------------
function findHospital() {
    window.open("https://www.google.com/maps/search/hospital+near+me", "_blank");
}