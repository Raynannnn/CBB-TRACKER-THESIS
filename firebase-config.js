// =====================================
// FIREBASE CONFIG
// =====================================
// 1. Gumawa ng FREE Firebase project sa https://console.firebase.google.com
// 2. Add app > Web app > kopyahin yung config object dito
// 3. I-enable sa Firebase Console: Authentication > Email/Password, at
//    Firestore Database (Create database, start in "production mode")
// 4. Gumawa ng ISANG user sa Authentication > Users > Add user (email/password ni Doc)

const firebaseConfig = {
  apiKey: "AIzaSyDPkHgeGxVmSI2YBX8_5K-g7TVOlqXkHNg",
  authDomain: "cbb-tracker.firebaseapp.com",
  projectId: "cbb-tracker",
  storageBucket: "cbb-tracker.firebasestorage.app",
  messagingSenderId: "760402100426",
  appId: "1:760402100426:web:7ccda1a82a61d08aeaf433",
  measurementId: "G-2BZ7HGNW5D"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// =====================================
// OWNER SETUP (bago ang feature na ito)
// =====================================
// 1. Sa Authentication > Users, gumawa ng SEPARATE account para sa Owner
//    (hiwalay sa admin account ni Doc), tapos ilagay yung email nito sa
//    OWNER_EMAILS array sa app.js.
// 2. Kahit sinong naka-login (Owner man o admin) ay may parehong access
//    sa Add/Edit/Delete/Borrow/Return — ang pinagkaiba lang ng Owner ay
//    nakikita niya yung "Login Activity" page.
// 3. Para hindi makita ng regular na admin ang loginLogs (privacy),
//    idagdag ito sa Firestore Rules (Firestore > Rules):
//
//    match /loginLogs/{doc} {
//      allow read: if request.auth != null &&
//                     request.auth.token.email in ["owner@cbbtracker.com"];
//      allow create: if request.auth != null;
//    }
//
//    Palitan yung email sa loob ng listahan ng parehong email na nasa
//    OWNER_EMAILS sa app.js.