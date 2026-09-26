// =====================================
// ROLE CONFIG
// (ginagamit ng app.js AT login.js)
// =====================================
// OWNER_EMAILS  — pinaka-taas na access, kasama ang pagkita ng Login Activity
//                 at Registered Users.
// ADMIN_EMAILS  — parehong management rights ng Owner (add/edit/delete/borrow/
//                 return + Login Activity + Registered Users), pero regular
//                 admin lang (hal. si Doc).
// Sinumang HINDI nasa dalawang listahang ito, at naka-login, ay itinuturing na
// regular na User (borrower) — view-only sila sa thesis table.

const OWNER_EMAILS = [
  "owner@cbbtracker.com"   // TODO: palitan ng aktwal na email ng Owner
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
