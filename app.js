// =====================================
// CBB THESIS TRACKER
// APP.JS (Firebase version)
// =====================================


// ===============================
// DATABASE (Firestore, real-time)
// ===============================

let thesisData = [];      // synced live from Firestore "thesis" collection
let borrowHistory = [];   // synced live from Firestore "history" collection
let loginLogs = [];       // synced live from Firestore "loginLogs" collection (Owner only)
let isLoggedIn = false;
let isOwner = false;

// ===============================
// OWNER CONFIG
// ===============================
// Ilagay dito ang email(s) ng Owner (yung account na dapat makakita
// ng Login Activity page). Puwedeng dagdagan ng iba pang owner email.
const OWNER_EMAILS = [
  "owner@cbbtracker.com"   // TODO: palitan ng aktwal na email ng Owner
];

const thesisRef = db.collection("thesis");
const historyRef = db.collection("history");
const loginLogsRef = db.collection("loginLogs");

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
  // Kapag walang access (hindi Owner) base sa Firestore rules, tahimik lang mag-fail.
  console.log("Login activity not visible:", err.message);
});


// ===============================
// AUTH (isang admin account lang: si Doc)
// ===============================

auth.onAuthStateChanged(function (user) {
  isLoggedIn = !!user;
  isOwner = isLoggedIn && OWNER_EMAILS.indexOf((user.email || "").toLowerCase()) !== -1;

  let authBtn = document.getElementById("authBtn");
  let addBtn = document.getElementById("addBtn");
  let roleBadge = document.getElementById("roleBadge");
  let ownerMenuItem = document.getElementById("ownerMenuItem");

  if (isLoggedIn) {
    authBtn.innerHTML = "LOGOUT";
    authBtn.classList.add("logged-in");
    addBtn.style.display = "inline-block";

    roleBadge.classList.add("show");
    roleBadge.innerHTML = isOwner ? "👑 OWNER" : "ADMIN";
  } else {
    authBtn.innerHTML = "LOGIN";
    authBtn.classList.remove("logged-in");
    addBtn.style.display = "none";

    roleBadge.classList.remove("show");
    roleBadge.innerHTML = "";
  }

  ownerMenuItem.style.display = isOwner ? "block" : "none";

  if (!isOwner) {
    document.getElementById("loginLogPage").style.display = "none";
  }

  displayThesis();   // i-refresh yung Action column base sa login state
  displayLoginLog();
});

document.getElementById("authBtn").onclick = function () {
  if (isLoggedIn) {
    auth.signOut();
  } else {
    document.getElementById("loginModal").style.display = "flex";
  }
};

document.getElementById("closeLogin").onclick = function () {
  document.getElementById("loginModal").style.display = "none";
};

document.getElementById("submitLogin").onclick = function () {
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;

  if (email === "" || password === "") {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(function () {
      document.getElementById("loginModal").style.display = "none";
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";

      // I-log ang login event para makita ng Owner (Login Activity page).
      loginLogsRef.add({
        email: email.toLowerCase(),
        timestamp: new Date().toISOString(),
        device: navigator.userAgent
      }).catch(function (err) {
        console.log("Could not record login activity:", err.message);
      });
    })
    .catch(function (err) {
      alert("Login failed: " + err.message);
    });
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

    let action;

    if (!isLoggedIn) {
      action = `<span class="view-only-note">View only</span>`;
    } else {
      action = item.status === "Available"
        ? `<button class="action borrow-btn" onclick="borrowThesis('${item.docId}')">Borrow</button>`
        : `<button class="action return-btn" onclick="returnThesis('${item.docId}')">Return</button>`;

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
// ADD THESIS
// ===============================


document.getElementById("addBtn").onclick = function () {
  document.getElementById("addModal").style.display = "flex";
};

document.getElementById("closeAdd").onclick = function () {
  document.getElementById("addModal").style.display = "none";
};

document.getElementById("saveThesis").onclick = function () {

  if (!isLoggedIn) { alert("Login first as admin."); return; }

  let title = document.getElementById("titleInput").value;
  let authors = document.getElementById("authorInput").value;
  let date = document.getElementById("dateInput").value;
  let adviser = document.getElementById("adviserInput").value;
  let program = document.getElementById("programInput").value;

  if (title === "" || authors === "" || adviser === "") {
    alert("Please complete information");
    return;
  }

  let countInProgram = thesisData.filter(function (x) { return x.program === program; }).length;

  let id = "CBB26-" + program + String(countInProgram + 1).padStart(2, "0");

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


let menu = document.querySelectorAll(".menu");

menu.forEach(function (item) {
  item.onclick = function () {

    menu.forEach(function (x) { x.classList.remove("active"); });
    this.classList.add("active");

    currentSection = this.dataset.section;

    if (currentSection === "LOGINLOG") {
      if (!isOwner) return; // safety net; item is hidden from non-Owners anyway
      document.getElementById("loginLogPage").style.display = "block";
      document.getElementById("loginLogPage").scrollIntoView({ behavior: "smooth" });
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
  if (!isLoggedIn) { alert("Login first as admin."); return; }
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

  if (!isLoggedIn) { alert("Login first as admin."); return; }

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
// LOGIN ACTIVITY (OWNER ONLY)
// ===============================


function displayLoginLog() {

  if (!isOwner) return;

  let table = document.getElementById("loginLogTable");
  if (!table) return;

  table.innerHTML = "";

  if (loginLogs.length === 0) {
    table.innerHTML = `<tr><td colspan="3">No login activity yet</td></tr>`;
    return;
  }

  loginLogs.forEach(function (item) {

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

    table.innerHTML += `
      <tr>
        <td>${item.email}</td>
        <td>${when}</td>
        <td>${device}</td>
      </tr>
    `;
  });
}


// ===============================
// EDIT THESIS
// ===============================


function editThesis(docId) {

  if (!isLoggedIn) { alert("Login first as admin."); return; }

  let thesis = thesisData.find(function (x) { return x.docId === docId; });

  let newTitle = prompt("Edit Thesis Title", thesis.title);
  let newAuthor = prompt("Edit Authors", thesis.authors);
  let newDate = prompt("Edit Date", thesis.date);
  let newAdviser = prompt("Edit Adviser", thesis.adviser);

  let updates = {};
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

  if (!isLoggedIn) { alert("Login first as admin."); return; }

  let confirmDelete = confirm("Are you sure you want to delete this thesis?");

  if (confirmDelete) {
    thesisRef.doc(docId).delete().then(function () {
      alert("Thesis Deleted");
    });
  }
}