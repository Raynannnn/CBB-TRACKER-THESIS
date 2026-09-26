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
// OWNER / ADMIN / USER SETUP
// =====================================
// May 3 klase ng account ngayon:
//   • Owner — pinaka-taas, makikita LAHAT (Login Activity + Registered Users)
//   • Admin — parehong management rights ng Owner (add/edit/delete/borrow/
//             return + Login Activity + Registered Users), pero hindi kailangang
//             siya lang mag-isa (hal. si Doc)
//   • User  — regular borrower, self-register sa "Create Account" tab sa
//             gate screen. View-only sila sa thesis table.
//
// 1. Sa app.js, ilagay ang email ng Owner sa OWNER_EMAILS, at email ng
//    admin/adviser (hal. si Doc) sa ADMIN_EMAILS.
// 2. Gumawa ng Firebase Auth account (Authentication > Users > Add user)
//    para sa Owner at sa Admin gamit ang eksaktong email na inilagay mo sa
//    OWNER_EMAILS / ADMIN_EMAILS. Hindi mo na kailangang gumawa ng account
//    para sa mga User — sila mismo gagawa nito sa "Create Account" tab.
// 3. Sa Firestore > Rules, idagdag ito para protektado ang loginLogs at
//    users collections (Owner/Admin lang makakabasa ng buong listahan;
//    kahit sino naka-login ay makaka-create ng sarili niyang record):
//
//    match /loginLogs/{doc} {
//      allow read: if request.auth != null &&
//                     request.auth.token.email in ["owner@cbbtracker.com","doc@cbbtracker.com"];
//      allow create: if request.auth != null;
//    }
//
//    match /users/{doc} {
//      allow read: if request.auth != null &&
//                     request.auth.token.email in ["owner@cbbtracker.com","doc@cbbtracker.com"];
//      allow create: if request.auth != null;
//    }
//
//    Palitan yung mga email sa loob ng listahan para tugma sa OWNER_EMAILS
//    at ADMIN_EMAILS na nasa app.js.