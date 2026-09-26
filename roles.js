// =====================================
// ROLE CONFIG
// (used by both app.js AND login.js)
// =====================================
// OWNER_EMAILS  — top-level access, including Login Activity
//                 and Registered Users.
// ADMIN_EMAILS  — same management rights as Owner (add/edit/delete/borrow/
//                 return + Login Activity + Registered Users), but a
//                 regular admin (e.g. Doc).
// Anyone NOT on either list, but logged in, is treated as a
// regular User (borrower) — view-only access to the thesis table.

const OWNER_EMAILS = [
  "owner@cbbtracker.com"   // TODO: replace with the Owner's actual email
];

const ADMIN_EMAILS = [
  "doc@cbbtracker.com"
];

function computeRole(email) {
  email = (email || "").toLowerCase();
  if (OWNER_EMAILS.indexOf(email) !== -1) return "owner";
  if (ADMIN_EMAILS.indexOf(email) !== -1) return "admin";
  return "user";
}