// firebase-init.js - Initializes the Firebase SDKs

// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// Note: Other Firebase functions like ref, set, get, GoogleAuthProvider, etc.,
// will be imported directly in the modules that use them (e.g., database.js, auth.js)

// === Your Specific Firebase Configuration ===
// Keep your actual config details here
const firebaseConfig = {
    apiKey: "AIzaSyAbYQWbMQBHOdT-PxwIXeDFvLgEXlX7PhY", // Replace with your actual API key if different
    authDomain: "dndfortheboys-d88d9.firebaseapp.com",
    databaseURL: "https://dndfortheboys-d88d9-default-rtdb.firebaseio.com",
    projectId: "dndfortheboys-d88d9",
    storageBucket: "dndfortheboys-d88d9.appspot.com",
    messagingSenderId: "721075269380",
    appId: "1:721075269380:web:197009bf7ded05903faa51",
    measurementId: "G-H4HSEM39X5" // Optional: Only if you use Analytics
};

// --- Initialize Firebase App ---
let app;
let database;
let auth;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    console.log("Firebase Initialized successfully (App, Database, Auth).");
} catch (error) {
    console.error("!!! Firebase Initialization Failed !!!", error);
    // Handle initialization error appropriately - maybe show a message to the user
    // For now, we export potentially undefined variables, consuming modules should check
    app = null;
    database = null;
    auth = null;
}


// --- Export the initialized instances ---
// Other modules will import these directly instead of using global window variables.
export { app, database, auth };

// --- Regarding firebaseReady event ---
// The original code dispatched a 'firebaseReady' event.
// In a modular setup, the main script (`main.js`) can simply import this file.
// Since imports are handled before the main script code runs, `main.js` can
// assume Firebase is initialized (or handle potential errors if app/database/auth are null)
// when it starts executing its own logic. We might not need the custom event anymore.
// We'll handle the initialization flow in main.js later.