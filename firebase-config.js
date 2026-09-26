// =====================================
// FIREBASE CONFIG
// =====================================
// 1. Create a FREE Firebase project at https://console.firebase.google.com
// 2. Add app > Web app > copy the config object here
// 3. Enable in the Firebase Console: Authentication > Email/Password, and
//    Firestore Database (Create database, start in "production mode")
// 4. Create ONE user in Authentication > Users > Add user (Doc's email/password)

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
// There are 3 kinds of account:
//   • Owner — top level, sees EVERYTHING (Login Activity + Registered Users)
//   • Admin — same management rights as Owner (add/edit/delete/borrow/
//             return + Login Activity + Registered Users), but doesn't have
//             to be the only one (e.g. Doc)
//   • User  — regular borrower, self-registers through the "Create Account"
//             tab on the gate screen. View-only access to the thesis table.
//
// 1. In roles.js, put the Owner's email in OWNER_EMAILS, and the
//    admin/adviser's email (e.g. Doc) in ADMIN_EMAILS.
// 2. Create a Firebase Auth account (Authentication > Users > Add user)
//    for the Owner and for the Admin, using the exact email you put in
//    OWNER_EMAILS / ADMIN_EMAILS. You don't need to create accounts for
//    Users — they create their own through the "Create Account" tab.
// 3. In Firestore > Rules, add this to protect the loginLogs and
//    users collections (only Owner/Admin can read the full list;
//    anyone logged in can still create their own record):
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
//    Replace those emails so they match OWNER_EMAILS and
//    ADMIN_EMAILS in roles.js.