// =====================================
// CBB THESIS TRACKER
// APP.JS (Firebase version)
// =====================================


// ===============================
// DATABASE (Firestore, real-time)
// ===============================

let thesisData = [];       // synced live from Firestore "thesis" collection
let borrowHistory = [];    // synced live from Firestore "history" collection
let loginLogs = [];        // synced live from Firestore "loginLogs" collection
let registeredUsers = [];  // synced live from Firestore "users" collection (borrower accounts)

let isLoggedIn = false;    // true kapag may naka-login, Admin/Owner man o regular User
let isOwner = false;
let isAdmin = false;
let isManager = false;     // Owner OR Admin — sila lang may management rights
let idTouched = false;     // true kapag na-edit na manually ang Thesis ID sa Add modal

// ===============================
// COLLECTIONS
// ===============================
// (OWNER_EMAILS / ADMIN_EMAILS / computeRole() ay nasa roles.js na —
//  ginagamit din 'yun ng login.js)

const thesisRef = db.collection("thesis");
const historyRef = db.collection("history");
const loginLogsRef = db.collection("loginLogs");
const usersRef = db.collection("users");

// Live sync: bawat may pagbabago sa database (kahit ibang device),
// automatic na mag-uupdate ang page na ito.
thesisRef.orderBy("id").onSnapshot(function (snapshot) {
  thesisData = snapshot.docs.map(function (doc) {
    return Object.assign({ docId: doc.id }, doc.data());
  });
  displayThesis();
  updateDashboard();
});

historyRef.orderBy("borrowDate").onSnapshot(function (snapshot) {
  borrowHistory = snapshot.docs.map(function (doc) {
    return Object.assign({ docId: doc.id }, doc.data());
  });
  displayHistory();
});

loginLogsRef.orderBy("timestamp", "desc").onSnapshot(function (snapshot) {
  loginLogs = snapshot.docs.map(function (doc) {
    return Object.assign({ docId: doc.id }, doc.data());
  });
  displayLoginLog();
}, function (err) {
  // Kapag walang access (hindi Owner/Admin) base sa Firestore rules, tahimik lang mag-fail.
  console.log("Login activity not visible:", err.message);
});

usersRef.orderBy("registeredAt", "desc").onSnapshot(function (snapshot) {
  registeredUsers = snapshot.docs.map(function (doc) {
    return Object.assign({ docId: doc.id }, doc.data());
  });
  displayUsers();
}, function (err) {
  console.log("Registered users not visible:", err.message);
});


// ===============================
// AUTH GATE (kailangan mag-login sa
// login.html bago makapasok dito)
// ===============================

auth.onAuthStateChanged(function (user) {
  isLoggedIn = !!user;

  if (!isLoggedIn) {
    // Walang session — ibalik sa login.html.
    window.location.href = "login.html";
    return;
  }

  let email = (user.email || "").toLowerCase();
  isOwner = OWNER_EMAILS.indexOf(email) !== -1;
  isAdmin = ADMIN_EMAILS.indexOf(email) !== -1;
  isManager = isOwner || isAdmin;

  let appShell = document.getElementById("appShell");
  let authBtn = document.getElementById("authBtn");
  let addBtn = document.getElementById("addBtn");
  let roleBadge = document.getElementById("roleBadge");
  let managerMenuItems = document.querySelectorAll(".manager-only");

  appShell.style.display = "flex";

  authBtn.innerHTML = "LOGOUT";
  authBtn.classList.add("logged-in");
  addBtn.style.display = isManager ? "inline-block" : "none";

  roleBadge.classList.add("show");
  roleBadge.innerHTML = isOwner ? "👑 OWNER" : (isAdmin ? "🛠️ ADMIN" : "🎓 USER");

  managerMenuItems.forEach(function (el) {
    el.style.display = isManager ? "block" : "none";
  });

  if (!isManager) {
    document.getElementById("loginLogPage").style.display = "none";
    document.getElementById("usersPage").style.display = "none";
  }

  displayThesis();   // i-refresh yung Action column base sa role
  displayLoginLog();
  displayUsers();
});

document.getElementById("authBtn").onclick = function () {
  if (isLoggedIn) auth.signOut();
  // pagkatapos mag-signOut, ang onAuthStateChanged sa itaas na ang
  // bahalang mag-redirect papunta sa login.html
};


// ===============================
// DISPLAY THESIS
// ===============================


let currentSection = "ALL";


function displayThesis() {

  let table = document.getElementById("thesisTable");
  table.innerHTML = "";

  let filtered = thesisData.filter(function (item) {
    if (currentSection === "ALL") return true;
    return item.program === currentSection;
  });

  let search = document.getElementById("searchBox").value.toLowerCase();

  filtered = filtered.filter(function (item) {
    return (
      item.id.toLowerCase().includes(search) ||
      item.title.toLowerCase().includes(search) ||
      item.authors.toLowerCase().includes(search)
    );
  });

  if (filtered.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7">No Thesis Found</td>
      </tr>
    `;
    return;
  }

  filtered.forEach(function (item) {

    let statusClass = item.status === "Available" ? "available" : "borrowed";

    let action = "";

    // Borrow: pwede ng regular User, hindi lang Manager (sila naman talaga
    // ang gagamit at mag-boborrow ng thesis).
    if (item.status === "Available") {
      action += `<button class="action borrow-btn" onclick="borrowThesis('${item.docId}')">Borrow</button>`;
    } else {
      // Return: kahit sino, User man o Manager — sila rin naman ang
      // nag-borrow kaya sila rin dapat makapag-return.
      action += `<button class="action return-btn" onclick="returnThesis('${item.docId}')">Return</button>`;
    }

    // Edit/Delete: Manager lang, User's gilid.
    if (isManager) {
      action += `
        <button class="action edit-btn" onclick="editThesis('${item.docId}')">Edit</button>
        <button class="action delete-btn" onclick="deleteThesis('${item.docId}')">Delete</button>
      `;
    }

    table.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>${item.authors}</td>
        <td>${item.date}</td>
        <td>${item.adviser}</td>
        <td><span class="status ${statusClass}">${item.status}</span></td>
        <td>${action}</td>
      </tr>
    `;
  });
}


// ===============================
// DASHBOARD
// ===============================


function updateDashboard() {

  document.getElementById("totalCount").innerHTML = thesisData.length;

  document.getElementById("availableCount").innerHTML =
    thesisData.filter(function (x) { return x.status === "Available"; }).length;

  document.getElementById("borrowedCount").innerHTML =
    thesisData.filter(function (x) { return x.status === "Borrowed"; }).length;
}


// ===============================
// ADD THESIS (may editable Thesis ID)
// ===============================


function suggestThesisId() {
  let program = document.getElementById("programInput").value;
  let countInProgram = thesisData.filter(function (x) { return x.program === program; }).length;
  document.getElementById("idInput").value = "CBB26-" + program + String(countInProgram + 1).padStart(2, "0");
}

document.getElementById("addBtn").onclick = function () {
  document.getElementById("addModal").style.display = "flex";
  idTouched = false;
  suggestThesisId();
};

document.getElementById("programInput").onchange = function () {
  if (!idTouched) suggestThesisId();
};

document.getElementById("idInput").oninput = function () {
  idTouched = true;
};

document.getElementById("closeAdd").onclick = function () {
  document.getElementById("addModal").style.display = "none";
};

document.getElementById("saveThesis").onclick = function () {

  if (!isManager) { alert("Admin access only."); return; }

  let id = document.getElementById("idInput").value.trim();
  let title = document.getElementById("titleInput").value;
  let authors = document.getElementById("authorInput").value;
  let date = document.getElementById("dateInput").value;
  let adviser = document.getElementById("adviserInput").value;
  let program = document.getElementById("programInput").value;

  if (id === "" || title === "" || authors === "" || adviser === "") {
    alert("Please complete information (including Thesis ID)");
    return;
  }

  let duplicate = thesisData.some(function (x) { return x.id === id; });
  if (duplicate) {
    alert("Thesis ID already exists. Please use a different one.");
    return;
  }

  thesisRef.add({
    id: id,
    title: title,
    authors: authors,
    date: date,
    adviser: adviser,
    program: program,
    status: "Available"
  }).then(function () {
    document.getElementById("addModal").style.display = "none";
    document.getElementById("idInput").value = "";
    document.getElementById("titleInput").value = "";
    document.getElementById("authorInput").value = "";
    document.getElementById("dateInput").value = "";
    document.getElementById("adviserInput").value = "";
    alert("Thesis Added!");
  }).catch(function (err) {
    alert("Error: " + err.message);
  });
};


// ===============================
// SECTION MENU
// ===============================


document.getElementById("programsToggle").onclick = function () {
  this.classList.toggle("open");
  document.getElementById("programsSubmenu").classList.toggle("open");
};

let menu = document.querySelectorAll(".menu");

menu.forEach(function (item) {
  item.onclick = function () {

    menu.forEach(function (x) { x.classList.remove("active"); });
    this.classList.add("active");

    currentSection = this.dataset.section;

    if (currentSection === "LOGINLOG") {
      if (!isManager) return; // safety net; item is hidden from Users anyway
      document.getElementById("loginLogPage").style.display = "block";
      document.getElementById("loginLogPage").scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (currentSection === "USERS") {
      if (!isManager) return; // safety net; item is hidden from Users anyway
      document.getElementById("usersPage").style.display = "block";
      document.getElementById("usersPage").scrollIntoView({ behavior: "smooth" });
      return;
    }

    document.getElementById("sectionTitle").innerHTML =
      currentSection === "ALL" ? "All Thesis" : currentSection + " Thesis";

    if (currentSection === "HISTORY") {
      document.getElementById("historyPage").scrollIntoView({ behavior: "smooth" });
    } else {
      displayThesis();
    }
  };
});


// ===============================
// SEARCH
// ===============================


document.getElementById("searchBox").onkeyup = function () {
  displayThesis();
};


// ===============================
// BORROW
// ===============================


let selectedDocId = null;

function borrowThesis(docId) {
  if (!isLoggedIn) { alert("Please log in first."); return; }
  selectedDocId = docId;
  document.getElementById("borrowModal").style.display = "flex";
}

document.getElementById("closeBorrow").onclick = function () {
  document.getElementById("borrowModal").style.display = "none";
};

document.getElementById("confirmBorrow").onclick = function () {

  let name = document.getElementById("borrowerInput").value;

  if (name === "") {
    alert("Enter borrower name");
    return;
  }

  let thesis = thesisData.find(function (x) { return x.docId === selectedDocId; });

  thesisRef.doc(selectedDocId).update({ status: "Borrowed" });

  historyRef.add({
    id: thesis.id,
    borrower: name,
    borrowDate: new Date().toLocaleDateString(),
    returnDate: "-",
    status: "Borrowed"
  }).then(function () {
    document.getElementById("borrowModal").style.display = "none";
    document.getElementById("borrowerInput").value = "";
  });
};


// ===============================
// RETURN
// ===============================


function returnThesis(docId) {

  if (!isLoggedIn) { alert("Please log in first."); return; }

  let thesis = thesisData.find(function (x) { return x.docId === docId; });

  thesisRef.doc(docId).update({ status: "Available" });

  let historyEntry = borrowHistory.find(function (item) {
    return item.id === thesis.id && item.status === "Borrowed";
  });

  if (historyEntry) {
    historyRef.doc(historyEntry.docId).update({
      status: "Returned",
      returnDate: new Date().toLocaleDateString()
    });
  }
}


// ===============================
// HISTORY
// ===============================


function displayHistory() {

  let table = document.getElementById("historyTable");
  table.innerHTML = "";

  borrowHistory.forEach(function (item) {
    table.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.borrower}</td>
        <td>${item.borrowDate}</td>
        <td>${item.returnDate}</td>
        <td><span class="status ${item.status === "Returned" ? "available" : "borrowed"}">${item.status}</span></td>
      </tr>
    `;
  });
}


// ===============================
// LOGIN ACTIVITY (Owner/Admin only)
// ===============================


function displayLoginLog() {

  let table = document.getElementById("loginLogTable");
  if (!table || !isManager) return;

  table.innerHTML = "";

  if (loginLogs.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No login activity yet</td></tr>`;
    return;
  }

  // Dedupe: isang row lang per account (latest login nila) + total
  // login count, para makita agad ni Owner/Admin lahat ng existing
  // accounts (at current role nila) imbes na paulit-ulit na log.
  // loginLogs ay naka-sort na desc by timestamp, kaya yung unang
  // ma-eencounter natin per email ang pinakabago — 'wag na palitan.
  let uniqueByEmail = {};

  loginLogs.forEach(function (item) {
    let key = (item.email || "").toLowerCase();
    if (!uniqueByEmail[key]) {
      uniqueByEmail[key] = Object.assign({ loginCount: 0 }, item);
    }
    uniqueByEmail[key].loginCount++;
  });

  let uniqueList = Object.values(uniqueByEmail);

  uniqueList.forEach(function (item) {

    let when = item.timestamp ? new Date(item.timestamp).toLocaleString() : "-";

    // Simplify the raw user-agent string into a short, readable label.
    let device = "Unknown device";
    if (item.device) {
      if (/Mobi/i.test(item.device)) device = "Mobile browser";
      else if (/Chrome/i.test(item.device)) device = "Chrome (desktop)";
      else if (/Firefox/i.test(item.device)) device = "Firefox (desktop)";
      else if (/Safari/i.test(item.device)) device = "Safari (desktop)";
      else device = "Desktop browser";
    }

    let roleLabel = item.role === "owner" ? "Owner" : (item.role === "admin" ? "Admin" : "User");

    table.innerHTML += `
      <tr>
        <td>${item.email}</td>
        <td>${roleLabel}</td>
        <td>${when}</td>
        <td>${device}</td>
        <td>${item.loginCount}x</td>
      </tr>
    `;
  });
}


// ===============================
// REGISTERED USERS (Owner/Admin only)
// ===============================


function displayUsers() {

  let table = document.getElementById("usersTable");
  if (!table || !isManager) return;

  table.innerHTML = "";

  if (registeredUsers.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No registered users yet</td></tr>`;
    return;
  }

  registeredUsers.forEach(function (item) {
    let registered = item.registeredAt ? new Date(item.registeredAt).toLocaleDateString() : "-";

    table.innerHTML += `
      <tr>
        <td>${item.name || "-"}</td>
        <td>${item.studentNumber || "-"}</td>
        <td>${item.course || "-"}</td>
        <td>${item.email}</td>
        <td>${registered}</td>
      </tr>
    `;
  });
}


// ===============================
// EDIT THESIS (kasama na ang Thesis ID)
// ===============================


function editThesis(docId) {

  if (!isManager) { alert("Admin access only."); return; }

  let thesis = thesisData.find(function (x) { return x.docId === docId; });

  let newId = prompt("Edit Thesis ID", thesis.id);
  let newTitle = prompt("Edit Thesis Title", thesis.title);
  let newAuthor = prompt("Edit Authors", thesis.authors);
  let newDate = prompt("Edit Date", thesis.date);
  let newAdviser = prompt("Edit Adviser", thesis.adviser);

  let updates = {};

  if (newId && newId.trim() !== "" && newId.trim() !== thesis.id) {
    let duplicate = thesisData.some(function (x) { return x.id === newId.trim() && x.docId !== docId; });
    if (duplicate) {
      alert("Thesis ID already exists — ID was not changed, other fields will still update.");
    } else {
      updates.id = newId.trim();
    }
  }

  if (newTitle) updates.title = newTitle;
  if (newAuthor) updates.authors = newAuthor;
  if (newDate) updates.date = newDate;
  if (newAdviser) updates.adviser = newAdviser;

  if (Object.keys(updates).length > 0) {
    thesisRef.doc(docId).update(updates).then(function () {
      alert("Thesis Updated!");
    });
  }
}


// ===============================
// DELETE THESIS
// ===============================


function deleteThesis(docId) {

  if (!isManager) { alert("Admin access only."); return; }

  let confirmDelete = confirm("Are you sure you want to delete this thesis?");

  if (confirmDelete) {
    thesisRef.doc(docId).delete().then(function () {
      alert("Thesis Deleted");
    });
  }
}