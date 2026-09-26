// =====================================
// CBB THESIS TRACKER
// LOGIN.JS — hawak ang Login / Create Account
// tabs sa login.html. Pagkatapos mag-login o
// mag-signup, dinadala ang user sa index.html
// (dashboard), kung saan hawak na ng app.js
// ang buong app.
// =====================================

const loginLogsRef = db.collection("loginLogs");
const usersRef = db.collection("users");

// Kapag may existing session pa rin (naka-login na),
// diretso na sa dashboard — wag nang ipakita ang login form.
auth.onAuthStateChanged(function (user) {
  if (user) {
    window.location.href = "index.html";
  }
});

function recordLogin(email, role) {
  loginLogsRef.add({
    email: (email || "").toLowerCase(),
    role: role,
    timestamp: new Date().toISOString(),
    device: navigator.userAgent
  }).catch(function (err) {
    console.log("Could not record login activity:", err.message);
  });
}


// ---- Gate tabs (Login / Create Account) ----

document.getElementById("tabLogin").onclick = function () {
  this.classList.add("active");
  document.getElementById("tabSignup").classList.remove("active");
  document.getElementById("gateLoginForm").style.display = "block";
  document.getElementById("gateSignupForm").style.display = "none";
};

document.getElementById("tabSignup").onclick = function () {
  this.classList.add("active");
  document.getElementById("tabLogin").classList.remove("active");
  document.getElementById("gateSignupForm").style.display = "block";
  document.getElementById("gateLoginForm").style.display = "none";
};


// ---- Enter key = submit (Login) ----

["gateEmail", "gatePassword"].forEach(function (id) {
  document.getElementById(id).addEventListener("keyup", function (e) {
    if (e.key === "Enter") document.getElementById("gateLoginBtn").click();
  });
});


// ---- Enter key = submit (Create Account) ----

["suName", "suStudentNo", "suCourse", "suEmailUser", "suPassword"].forEach(function (id) {
  document.getElementById(id).addEventListener("keyup", function (e) {
    if (e.key === "Enter") document.getElementById("gateSignupBtn").click();
  });
});


// ---- Login ----

document.getElementById("gateLoginBtn").onclick = function () {
  let email = document.getElementById("gateEmail").value.trim();
  let password = document.getElementById("gatePassword").value;

  if (email === "" || password === "") {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(function () {
      recordLogin(email, computeRole(email));
      window.location.href = "index.html";
    })
    .catch(function (err) {
      alert("Login failed: " + err.message);
    });
};


// ---- Sign Up (para sa mga User/borrower) ----

document.getElementById("gateSignupBtn").onclick = function () {
  let name = document.getElementById("suName").value.trim();
  let studentNo = document.getElementById("suStudentNo").value.trim();
  let course = document.getElementById("suCourse").value.trim();
  let emailUser = document.getElementById("suEmailUser").value.trim();
  let email = emailUser === "" ? "" : emailUser + "@cbbtracker.com";
  let password = document.getElementById("suPassword").value;

  if (name === "" || emailUser === "" || password === "") {
    alert("Please complete the required fields (Name, Email, Password).");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(function () {
      return usersRef.add({
        name: name,
        studentNumber: studentNo,
        course: course,
        email: email.toLowerCase(),
        role: "user",
        registeredAt: new Date().toISOString()
      });
    })
    .then(function () {
      recordLogin(email, "user");
      window.location.href = "index.html";
    })
    .catch(function (err) {
      alert("Sign up failed: " + err.message);
    });
};