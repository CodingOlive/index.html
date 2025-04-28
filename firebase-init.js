// firebase-init.js - Initializes the Firebase SDKs

// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// === Your Specific Firebase Configuration ===
const firebaseConfig = {
    apiKey: "AIzaSyAbYQWbMQBHOdT-PxwIXeDFvLgEXlX7PhY", // Use your actual key
    authDomain: "dndfortheboys-d88d9.firebaseapp.com",
    databaseURL: "https://dndfortheboys-d88d9-default-rtdb.firebaseio.com",
    projectId: "dndfortheboys-d88d9",
    storageBucket: "dndfortheboys-d88d9.appspot.com",
    messagingSenderId: "721075269380",
    appId: "1:721075269380:web:197009bf7ded05903faa51",
    measurementId: "G-H4HSEM39X5"
};

// --- Initialize Firebase App ---
// Declare variables outside try/catch so they are always exported
let app = null;
let database = null;
let auth = null; // <-- Declared here

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app); // <-- Initialized here
    console.log("Firebase Initialized successfully (App, Database, Auth).");
} catch (error) {
    console.error("!!! Firebase Initialization Failed !!!", error);
    // Ensure they remain null if initialization fails
    app = null;
    database = null;
    auth = null;
}


// --- Export the initialized instances ---
export { app, database, auth }; // <-- Exported here

