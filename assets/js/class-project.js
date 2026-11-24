(function () {
  "use strict";

  var DB_KEY = "stem_class_project_sqlite_v2";
  var SESSION_KEY = "stem_class_project_session";
  var db = null;
  var student = null;
  var selectedId = null;
  var editingWorkId = null;

  var authEl = document.getElementById("auth");
  var appEl = document.getElementById("app");
  var statusEl = document.getElementById("status");
  var authAlert = document.getElementById("auth-alert");
  var projectList = document.getElementById("project-list");
  var workBody = document.getElementById("work-body");
  var workPanel = document.getElementById("work-panel");
  var projectForm = document.getElementById("project-form");
  var workForm = document.getElementById("work-form");
  var deleteProjectBtn = document.getElementById("delete-project");
  var projectHeading = document.getElementById("project-heading");

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function hashPassword(password) {
    var h1 = 0x811c9dc5;
    var h2 = 0x811c9dc5;
    var text = "class-project|" + password;
    var i;
    for (i = 0; i < text.length; i++) {
      h1 ^= text.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= text.charCodeAt(text.length - 1 - i);
      h2 = Math.imul(h2, 0x01000193);
    }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }

  function say(message, isError) {
    statusEl.textContent = message || "";
    statusEl.className = isError ? "text-danger small mb-2" : "text-success small mb-2";
  }

  function sayAuth(message) {
    if (!message) {
      authAlert.classList.add("d-none");
      authAlert.textContent = "";
      return;
    }
    authAlert.textContent = message;
    authAlert.classList.remove("d-none");
  }

  function rows(sql, params) {
    var stmt = db.prepare(sql);
    stmt.bind(params || []);
    var list = [];
    while (stmt.step()) list.push(stmt.getAsObject());
    stmt.free();
    return list;
  }

  function write(sql, params) {
    db.run(sql, params || []);
    var result = db.exec("SELECT last_insert_rowid()");
    var id = result.length ? result[0].values[0][0] : 0;
    saveDb();
    return id;
  }

  function bytesToBase64(bytes) {
    var binary = "";
    var size = 0x8000;
    var i;
    for (i = 0; i < bytes.length; i += size) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + size));
    }
    return btoa(binary);
  }

  function base64ToBytes(text) {
    var binary = atob(text);
    var bytes = new Uint8Array(binary.length);
    var i;
    for (i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function saveDb() {
    localStorage.setItem(DB_KEY, bytesToBase64(db.export()));
  }

  function createSchema() {
    db.run("PRAGMA foreign_keys = ON");
    db.run(
      "CREATE TABLE IF NOT EXISTS student (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "full_name TEXT NOT NULL," +
        "class_name TEXT NOT NULL," +
        "username TEXT NOT NULL UNIQUE," +
        "password_hash TEXT NOT NULL," +
        "created_at TEXT NOT NULL)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS class_project (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "student_id INTEGER NOT NULL," +
        "title TEXT NOT NULL," +
        "stem_area TEXT NOT NULL," +
        "problem TEXT NOT NULL," +
        "status TEXT NOT NULL," +
        "created_at TEXT NOT NULL," +
        "updated_at TEXT NOT NULL," +
        "FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS work_done (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "project_id INTEGER NOT NULL," +
        "work_date TEXT NOT NULL," +
        "task TEXT NOT NULL," +
        "detail TEXT NOT NULL," +
        "hours REAL NOT NULL DEFAULT 0," +
        "created_at TEXT NOT NULL," +
        "FOREIGN KEY (project_id) REFERENCES class_project(id) ON DELETE CASCADE)"
    );
  }

  function seed() {
    if (rows("SELECT id FROM student LIMIT 1").length) return;
    var hash = hashPassword("stem123");
    var stamp = nowIso();
    var aishaId = write(
      "INSERT INTO student (full_name, class_name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ["Aisha Khan", "Class 8 A", "aisha", hash, stamp]
    );
    write("INSERT INTO student (full_name, class_name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", [
      "Arjun Mehta",
      "Class 8 A",
      "arjun",
      hash,
      stamp
    ]);
    write("INSERT INTO student (full_name, class_name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", [
      "Meera Iyer",
      "Class 9 B",
      "meera",
      hash,
      stamp
    ]);
    var projectId = write(
      "INSERT INTO class_project (student_id, title, stem_area, problem, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        aishaId,
        "Household water filter",
        "Engineering",
        "Can sand, charcoal and cloth clean muddy water enough to look clear?",
        "Building",
        stamp,
        stamp
      ]
    );
    write(
      "INSERT INTO work_done (project_id, work_date, task, detail, hours, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [projectId, today(), "Cut the bottles", "Made two chambers from plastic bottles and marked the layers.", 1, stamp]
    );
    write(
      "INSERT INTO work_done (project_id, work_date, task, detail, hours, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [projectId, today(), "First test", "Poured muddy water. The cloth clogged, so I will add a coarser layer.", 0.5, stamp]
    );
  }

  function openSession(row) {
    student = { id: row.id, full_name: row.full_name, class_name: row.class_name, username: row.username };
    sessionStorage.setItem(SESSION_KEY, String(row.id));
    authEl.classList.add("d-none");
    appEl.classList.remove("d-none");
    $("who").textContent = row.full_name + " · " + row.class_name;
    selectedId = null;
    clearProjectForm();
    renderProjects();
    say("Signed in. Your rows are stored in this browser’s SQLite database.");
  }

  function restoreSession() {
    var id = Number(sessionStorage.getItem(SESSION_KEY));
    if (!id) return;
    var row = rows("SELECT id, full_name, class_name, username FROM student WHERE id = ?", [id])[0];
    if (row) openSession(row);
  }

  function renderProjects() {
    var list = rows(
      "SELECT id, title, stem_area, status, updated_at FROM class_project WHERE student_id = ? ORDER BY updated_at DESC",
      [student.id]
    );
    if (!list.length) {
      projectList.innerHTML = '<p class="hint mb-0">No project yet. Use the form to add your STEM project.</p>';
      return;
    }
    projectList.innerHTML = list
      .map(function (item) {
        return (
          '<button type="button" class="project-btn' +
          (item.id === selectedId ? " active" : "") +
          '" data-id="' +
          item.id +
          '"><strong>' +
          esc(item.title) +
          '</strong><br><small>' +
          esc(item.stem_area) +
          ' · <span class="badge-status ' +
          esc(item.status) +
          '">' +
          esc(item.status) +
          "</span></small></button>"
        );
      })
      .join("");
  }

  function renderWork() {
    if (!selectedId) {
      workPanel.classList.add("d-none");
      return;
    }
    workPanel.classList.remove("d-none");
    var list = rows(
      "SELECT w.id, w.work_date, w.task, w.detail, w.hours FROM work_done w " +
        "JOIN class_project p ON p.id = w.project_id " +
        "WHERE w.project_id = ? AND p.student_id = ? ORDER BY w.work_date DESC, w.id DESC",
      [selectedId, student.id]
    );
    if (!list.length) {
      workBody.innerHTML = '<tr><td colspan="5" class="hint">No work saved for this project yet.</td></tr>';
      return;
    }
    workBody.innerHTML = list
      .map(function (item) {
        return (
          "<tr><td>" +
          esc(item.work_date) +
          "</td><td>" +
          esc(item.task) +
          "</td><td>" +
          esc(item.detail) +
          "</td><td>" +
          esc(item.hours) +
          '</td><td class="text-nowrap"><button type="button" class="btn btn-sm btn-outline-primary me-1" data-edit-work="' +
          item.id +
          '">Edit</button><button type="button" class="btn btn-sm btn-outline-danger" data-delete-work="' +
          item.id +
          '">Delete</button></td></tr>'
        );
      })
      .join("");
  }

  function clearProjectForm() {
    projectForm.reset();
    $("project-id").value = "";
    $("stem-area").value = "Science";
    $("project-status").value = "Planning";
    projectHeading.textContent = "New class project";
    deleteProjectBtn.classList.add("d-none");
    selectedId = null;
    resetWorkForm();
    renderWork();
    renderProjects();
  }

  function loadProject(id) {
    var item = rows(
      "SELECT id, title, stem_area, problem, status FROM class_project WHERE id = ? AND student_id = ?",
      [id, student.id]
    )[0];
    if (!item) return;
    selectedId = item.id;
    $("project-id").value = item.id;
    $("title").value = item.title;
    $("stem-area").value = item.stem_area;
    $("problem").value = item.problem;
    $("project-status").value = item.status;
    projectHeading.textContent = "Edit class project";
    deleteProjectBtn.classList.remove("d-none");
    resetWorkForm();
    renderProjects();
    renderWork();
    say("Opened “" + item.title + "” from class_project.");
  }

  function resetWorkForm() {
    editingWorkId = null;
    workForm.reset();
    $("work-date").value = today();
    $("work-hours").value = "1";
    $("save-work").textContent = "Add work";
    $("cancel-work").classList.add("d-none");
  }

  function login(event) {
    event.preventDefault();
    sayAuth("");
    var username = $("login-username").value.trim().toLowerCase();
    var password = $("login-password").value;
    var row = rows(
      "SELECT id, full_name, class_name, username FROM student WHERE username = ? AND password_hash = ?",
      [username, hashPassword(password)]
    )[0];
    if (!row) {
      sayAuth("No student matches that username and password.");
      return;
    }
    openSession(row);
  }

  function register(event) {
    event.preventDefault();
    sayAuth("");
    var name = $("reg-name").value.trim();
    var grade = $("reg-grade").value;
    var section = $("reg-section").value.trim().toUpperCase();
    var username = $("reg-username").value.trim().toLowerCase();
    var password = $("reg-password").value;
    if (name.length < 2 || username.length < 3 || password.length < 4) {
      sayAuth("Use a full name, a username of 3 or more letters, and a password of 4 or more characters.");
      return;
    }
    var className = "Class " + grade + (section ? " " + section : "");
    var newId;
    try {
      newId = write(
        "INSERT INTO student (full_name, class_name, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        [name, className, username, hashPassword(password), nowIso()]
      );
    } catch (err) {
      sayAuth("That username is already in the student table.");
      return;
    }
    var row = rows("SELECT id, full_name, class_name, username FROM student WHERE id = ?", [newId])[0];
    openSession(row);
  }

  function saveProject(event) {
    event.preventDefault();
    var title = $("title").value.trim();
    var area = $("stem-area").value;
    var problem = $("problem").value.trim();
    var status = $("project-status").value;
    if (!title || !problem) {
      say("Add a project title and the problem you are solving.", true);
      return;
    }
    var stamp = nowIso();
    if (selectedId) {
      write(
        "UPDATE class_project SET title = ?, stem_area = ?, problem = ?, status = ?, updated_at = ? WHERE id = ? AND student_id = ?",
        [title, area, problem, status, stamp, selectedId, student.id]
      );
      say("Updated class_project.");
    } else {
      selectedId = write(
        "INSERT INTO class_project (student_id, title, stem_area, problem, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [student.id, title, area, problem, status, stamp, stamp]
      );
      $("project-id").value = selectedId;
      projectHeading.textContent = "Edit class project";
      deleteProjectBtn.classList.remove("d-none");
      say("Saved a new row in class_project.");
    }
    renderProjects();
    renderWork();
  }

  function deleteProject() {
    if (!selectedId) return;
    var item = rows("SELECT title FROM class_project WHERE id = ? AND student_id = ?", [selectedId, student.id])[0];
    if (!item) return;
    if (!window.confirm("Delete “" + item.title + "” and every work_done row linked to it?")) return;
    write("DELETE FROM work_done WHERE project_id = ?", [selectedId]);
    write("DELETE FROM class_project WHERE id = ? AND student_id = ?", [selectedId, student.id]);
    clearProjectForm();
    say("Deleted the project and its work.");
  }

  function saveWork(event) {
    event.preventDefault();
    if (!selectedId) {
      say("Save the class project before adding work.", true);
      return;
    }
    var owned = rows("SELECT id FROM class_project WHERE id = ? AND student_id = ?", [selectedId, student.id])[0];
    if (!owned) return;
    var workDate = $("work-date").value;
    var task = $("work-task").value.trim();
    var detail = $("work-detail").value.trim();
    var hours = Number($("work-hours").value);
    if (!workDate || !task || !detail || !(hours >= 0)) {
      say("Fill the date, task, what you did, and hours.", true);
      return;
    }
    if (editingWorkId) {
      write(
        "UPDATE work_done SET work_date = ?, task = ?, detail = ?, hours = ? WHERE id = ? AND project_id = ?",
        [workDate, task, detail, hours, editingWorkId, selectedId]
      );
      say("Updated work_done.");
    } else {
      write(
        "INSERT INTO work_done (project_id, work_date, task, detail, hours, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [selectedId, workDate, task, detail, hours, nowIso()]
      );
      say("Added a row to work_done.");
    }
    write("UPDATE class_project SET updated_at = ? WHERE id = ? AND student_id = ?", [nowIso(), selectedId, student.id]);
    resetWorkForm();
    renderWork();
    renderProjects();
  }

  function onWorkClick(event) {
    var editBtn = event.target.closest("[data-edit-work]");
    var deleteBtn = event.target.closest("[data-delete-work]");
    if (editBtn) {
      var item = rows(
        "SELECT w.id, w.work_date, w.task, w.detail, w.hours FROM work_done w " +
          "JOIN class_project p ON p.id = w.project_id WHERE w.id = ? AND p.student_id = ?",
        [Number(editBtn.getAttribute("data-edit-work")), student.id]
      )[0];
      if (!item) return;
      editingWorkId = item.id;
      $("work-date").value = item.work_date;
      $("work-task").value = item.task;
      $("work-detail").value = item.detail;
      $("work-hours").value = item.hours;
      $("save-work").textContent = "Update work";
      $("cancel-work").classList.remove("d-none");
      $("work-task").focus();
    }
    if (deleteBtn) {
      var workId = Number(deleteBtn.getAttribute("data-delete-work"));
      if (!window.confirm("Delete this work row?")) return;
      write(
        "DELETE FROM work_done WHERE id = ? AND project_id IN (SELECT id FROM class_project WHERE student_id = ?)",
        [workId, student.id]
      );
      if (editingWorkId === workId) resetWorkForm();
      renderWork();
      say("Deleted the work_done row.");
    }
  }

  function logout() {
    student = null;
    selectedId = null;
    sessionStorage.removeItem(SESSION_KEY);
    appEl.classList.add("d-none");
    authEl.classList.remove("d-none");
    say("");
  }

  function downloadDb() {
    var bytes = db.export();
    var blob = new Blob([bytes], { type: "application/octet-stream" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "class-project.sqlite";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function bind() {
    $("login-form").addEventListener("submit", login);
    $("register-form").addEventListener("submit", register);
    projectForm.addEventListener("submit", saveProject);
    workForm.addEventListener("submit", saveWork);
    deleteProjectBtn.addEventListener("click", deleteProject);
    $("new-project").addEventListener("click", function () {
      clearProjectForm();
      say("Ready for a new class_project row.");
    });
    $("cancel-work").addEventListener("click", resetWorkForm);
    $("logout").addEventListener("click", logout);
    $("download-db").addEventListener("click", downloadDb);
    projectList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-id]");
      if (button) loadProject(Number(button.getAttribute("data-id")));
    });
    workBody.addEventListener("click", onWorkClick);
    $("work-date").value = today();
  }

  function start(SQL) {
    var saved = localStorage.getItem(DB_KEY);
    db = saved ? new SQL.Database(base64ToBytes(saved)) : new SQL.Database();
    createSchema();
    seed();
    bind();
    restoreSession();
  }

  var SQL = window.initSqlJs;
  if (!SQL) {
    sayAuth("The database library did not load. Check the network and refresh.");
    return;
  }
  SQL({
    locateFile: function (file) {
      return "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/" + file;
    }
  })
    .then(start)
    .catch(function () {
      sayAuth("SQLite could not start. Refresh the page and try again.");
    });
})();
