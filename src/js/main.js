// ═══════════════════════════════════════════════════════
// app.js — Single script for client.html & pm-view.html
//
// HTML setup required:
//   client.html:  <body data-view="client">
//   pm-view.html: <body data-view="pm">
//
// Both views share the same stat IDs:
//   #statTotal, #statOpen, #statProgress, #statResolved
//   PM also has: #statClosed, #statCritical
// ═══════════════════════════════════════════════════════

const IS_PM = () => document.body.dataset.view === "pm";

// ── CONSTANTS ──────────────────────────────────────────
const STATUS_CLASS = {
  Open: "primary text-white",
  "In Progress": "warning text-dark",
  Resolved: "success text-white",
  Closed: "secondary text-white",
};

const PRIO_STYLE = {
  Critical: "background:#ffe4e6;color:#be123c",
  High: "background:#ffedd5;color:#9a3412",
  Medium: "background:#fef9c3;color:#78350f",
  Low: "background:#f0fdf4;color:#14532d",
};

const PAGE_SIZE = 8;

const SIDEBAR_STORAGE_KEY = "servicedesk_sidebar_collapsed";
const TICKETS_STORAGE_KEY = "servicedesk_tickets";
const NOTIFS_STORAGE_KEY = "servicedesk_notifs";

// ── UTILITIES ──────────────────────────────────────────
const initials = (n) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

function statusBadgeHTML(status, extra = "") {
  const sc = STATUS_CLASS[status] || "secondary text-white";
  const [bg, txt] = sc.split(" ");
  return `<span class="badge bg-${bg} ${txt || ""} rounded-pill" style="font-size:11px" ${extra}>${status}</span>`;
}

function prioBadgeHTML(priority, extra = "") {
  return `<span class="badge rounded-pill" style="${PRIO_STYLE[priority] || PRIO_STYLE.Low};font-size:11px" ${extra}>${priority}</span>`;
}

// ── SIDEBAR ────────────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  const brandIcon = document.querySelector(".brand-icon");
  if (!sidebar || !toggleBtn) return;

  if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true") {
    sidebar.classList.add("collapsed");
  }

  toggleBtn.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      sidebar.classList.contains("collapsed"),
    );
  });

  if (brandIcon) {
    brandIcon.addEventListener("click", function () {
      if (sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        localStorage.setItem(SIDEBAR_STORAGE_KEY, false);
      }
    });
  }
}

// ── PAGINATION ─────────────────────────────────────────
function renderPagination(page, totalFiltered, goPageFnName) {
  const pages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  let btns = `<button class="page-btn" onclick="${goPageFnName}(${page - 1})" ${page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i></button>`;
  let s = Math.max(1, page - 2),
    e = Math.min(pages, s + 4);
  if (e - s < 4) s = Math.max(1, e - 4);
  for (let p = s; p <= e; p++)
    btns += `<button class="page-btn ${p === page ? "active" : ""}" onclick="${goPageFnName}(${p})">${p}</button>`;
  btns += `<button class="page-btn" onclick="${goPageFnName}(${page + 1})" ${page === pages ? "disabled" : ""}><i class="bi bi-chevron-right"></i></button>`;
  return btns;
}

// ── TOAST ──────────────────────────────────────────────
function showToast({ type = "info", title = "", message = "" }) {
  const config = {
    success: { bg: "#bbf7d0", fg: "#166534", icon: "bi-check-circle" },
    info: { bg: "#bae6fd", fg: "#075985", icon: "bi-info-circle" },
    warning: { bg: "#fef3c7", fg: "#92400e", icon: "bi-exclamation-circle" },
    error: { bg: "#fecaca", fg: "#b91c1c", icon: "bi-x-circle" },
  };
  const { bg, fg, icon } = config[type] || config.info;

  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container position-fixed bottom-0 start-0 p-3";
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast show d-flex align-items-center mb-2";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.style.cssText = `background:${bg};color:${fg};border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:320px;max-width:450px`;
  toast.innerHTML = `
    <div class="d-flex align-items-center px-3 py-2 flex-grow-1">
      <i class="bi ${icon} me-2" style="font-size:20px;color:${fg}"></i>
      <div>
        <div class="fw-semibold" style="font-size:15px;color:${fg}">${title}</div>
        <div style="font-size:13px;color:${fg}">${message}</div>
      </div>
    </div>
    <button type="button" class="btn-close ms-3 me-2" style="filter:invert(0.7)" aria-label="Close"></button>
  `;
  toast.querySelector(".btn-close").onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// ── LOGOUT ─────────────────────────────────────────────
function doLogout() {
  window.location.href = "index.html";
}
window.doLogout = doLogout;

// ── CREATE TICKET MODAL ────────────────────────────────
function openCreateModal() {
  // Reporter — always the current logged-in user
  const ctReporter = document.getElementById("ctReporter");
  if (ctReporter) ctReporter.value = CURRENT_USER;

  // Show the right 4th column: Developer for PM, Manager for client
  const devWrap = document.getElementById("ctDeveloperWrap");
  const mgrWrap = document.getElementById("ctManagerWrap");
  if (devWrap) devWrap.style.display = IS_PM() ? "" : "none";
  if (mgrWrap) mgrWrap.style.display = IS_PM() ? "none" : "";

  // Populate Developer options from AGENTS
  const ctDeveloper = document.getElementById("ctDeveloper");
  if (ctDeveloper && IS_PM()) {
    ctDeveloper.innerHTML = AGENTS.map((a) => `<option value="${a}">${a}</option>`).join("");
  }

  // Populate Manager options from stored PMs
  const ctManager = document.getElementById("ctManager");
  if (ctManager && !IS_PM()) {
    let pms;
    try { pms = JSON.parse(localStorage.getItem("servicedesk_pms")) || ["Matthew Samson", "John Doe"]; }
    catch(e) { pms = ["Matthew Samson", "John Doe"]; }
    ctManager.innerHTML = pms.map((m) => `<option value="${m}">${m}</option>`).join("");
  }

  new bootstrap.Modal(document.getElementById("createTicketModal")).show();
}
window.openCreateModal = openCreateModal;

// ── EXPANDED TICKET VIEW ───────────────────────────────
function openExpandedView() {
  if (!selectedTicket) return;
  _offcanvas.hide();

  let overlay = document.getElementById("ticketExpandedOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "ticketExpandedOverlay";
    document.body.appendChild(overlay);
  }

  const isFirstOpen = overlay.style.display === "none" || overlay.style.display === "";
  overlay.style.cssText = "position:fixed;inset:0;z-index:1060;display:flex;align-items:stretch;padding:16px;background:rgba(15,23,42,0.5);backdrop-filter:blur(3px)";
  overlay.onclick = (e) => { if (e.target === overlay) closeExpandedView(); };

  // Build or rebuild innerHTML
  _renderExpHTML(overlay, isFirstOpen);
}

function _renderExpHTML(overlay, animate) {
  const t = selectedTicket;
  const cms = commentsMap[t.id] || [];
  const nts = IS_PM() ? (NOTES[t.id] || []) : [];

  const commentsHTML = cms.length
    ? cms.map((c) => `
      <div class="d-flex gap-2 mb-3">
        <div class="avatar-sm ${c.role === "support" ? "green" : ""} flex-shrink-0">${initials(c.author)}</div>
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <span class="fw-bold" style="font-size:12.5px">${c.author}</span>
            <span class="comment-role-badge ${c.role}">${c.role === "client" ? "Client" : "Support"}</span>
            <span class="text-muted ms-auto" style="font-size:11px">${c.time}</span>
          </div>
          <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${c.text}</p>
          ${c.attachments && c.attachments.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">${c.attachments.map(src => `<img src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}</div>` : ""}
        </div>
      </div>`).join("")
    : '<p class="text-muted" style="font-size:13px">No comments yet.</p>';

  const actHTML = t.activity && t.activity.length
    ? t.activity.map((a) => `
      <div style="font-size:12.5px;color:#7a8599;margin-bottom:8px;padding-left:14px;border-left:2px solid #e4e9f2">
        <span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action}
        ${a.value ? `<strong>${a.value}</strong>` : ""}
        <span style="font-size:11px;color:#bfc6d1;margin-left:6px">${a.time}</span>
      </div>`).join("")
    : '<p class="text-muted" style="font-size:13px">No activity yet.</p>';

  const notesSection = IS_PM() ? `
    <div class="border-top p-3" style="background:#fffbeb">
      <p class="text-uppercase fw-semibold mb-2" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">
        <i class="bi bi-lock-fill me-1" style="color:#f59e0b"></i>Internal Notes
        <span style="font-size:10px;color:#9aa5bc;font-weight:400;text-transform:none;letter-spacing:0">(PM only)</span>
      </p>
      ${nts.length ? nts.map(n => `
        <div class="rounded-2 p-2 mb-2" style="background:#fff;border:1px solid #fde68a">
          <div style="font-size:11px;color:#92400e;font-weight:600;margin-bottom:3px">🔒 ${n.author} · ${n.time}</div>
          <div style="font-size:13px;color:#3a4560">${n.text}</div>
        </div>`).join("") : '<p class="text-muted mb-2" style="font-size:13px">No internal notes.</p>'}
      <textarea id="expNewNote" class="form-control form-control-sm rounded-2 mb-2" rows="2"
        style="font-size:13px;font-family:inherit;resize:none" placeholder="Add a private note..."></textarea>
      <button class="btn btn-sm btn-outline-secondary rounded-2 fw-semibold" onclick="expAddNote()">
        <i class="bi bi-plus me-1"></i>Add Note
      </button>
    </div>` : "";

  const attachHTML = t.attachments && t.attachments.length
    ? `<div class="mb-3">
        <p class="text-uppercase fw-semibold mb-2" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Attachments</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${t.attachments.map(src => `<img src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}
        </div>
      </div>` : "";

  // Manager inline edit
  let mgOptions = "";
  try { const pms = JSON.parse(localStorage.getItem("servicedesk_pms")) || ["Matthew Samson","John Doe"]; mgOptions = pms.map(p => `<option value="${p}" ${p===t.manager?"selected":""}>${p}</option>`).join(""); }
  catch(e) { mgOptions = `<option value="${t.manager}">${t.manager}</option>`; }

  const managerField = `
    <div class="d-flex align-items-center gap-2">
      <div class="avatar-sm ${t.ac||""}" style="width:22px;height:22px;font-size:9px">${initials(t.manager||"?")}</div>
      <span id="expManagerDisplay" style="cursor:pointer;text-decoration:underline dotted;font-size:13px;font-weight:600">${t.manager||"—"}</span>
      <select id="expManagerSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:130px;font-size:13px">${mgOptions}</select>
    </div>`;

  const devField = IS_PM() ? `
    <div class="col-6">
      <div class="p-3 rounded-3 border" style="background:#f8fafc">
        <p class="text-uppercase fw-semibold mb-1" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Developer</p>
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-sm" style="width:22px;height:22px;font-size:9px;background:#e0e7ef;color:#3b3b4f;border-radius:7px">${initials(t.developer||"?")}</div>
          <span id="expDeveloperDisplay" style="cursor:pointer;text-decoration:underline dotted;font-size:13px;font-weight:600">${t.developer||"—"}</span>
          <select id="expDeveloperSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:130px;font-size:13px">
            ${AGENTS.map(a => `<option value="${a}" ${a===t.developer?"selected":""}>${a}</option>`).join("")}
          </select>
        </div>
      </div>
    </div>` : "";

  const canRemove = true; // always allow click; doRemoveTicket() enforces the rule itself
  const panelStyle = animate
    ? "position:relative;flex:1;display:flex;flex-direction:column;background:#f5f7fb;border-radius:14px;box-shadow:0 20px 60px rgba(15,23,42,0.25);overflow:hidden;transition:transform .25s ease,opacity .25s ease;transform:translateY(12px);opacity:0"
    : "position:relative;flex:1;display:flex;flex-direction:column;background:#f5f7fb;border-radius:14px;box-shadow:0 20px 60px rgba(15,23,42,0.25);overflow:hidden";

  overlay.innerHTML = `
    <div id="expPanel" onclick="event.stopPropagation()" style="${panelStyle}">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom flex-shrink-0" style="background:#fff;flex-wrap:wrap;gap:10px">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <button class="btn btn-sm btn-light border rounded-2 fw-semibold" style="font-size:13px" onclick="closeExpandedView()">
            <i class="bi bi-arrow-left me-1"></i>Back
          </button>
          <span class="ticket-id">${t.id}</span>
          <div class="d-flex gap-2 align-items-center">${statusBadgeHTML(t.status)} ${prioBadgeHTML(t.priority)} ${catBadge(t.category)}</div>
        </div>
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div>
            <label class="text-uppercase text-muted fw-semibold d-block mb-1" style="font-size:10px;letter-spacing:.6px">Status</label>
            <select class="action-select" onchange="updateStatus(this.value)">
              ${["Open","In Progress","Resolved","Closed"].map(s => `<option value="${s}" ${t.status===s?"selected":""}>${s}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="text-uppercase text-muted fw-semibold d-block mb-1" style="font-size:10px;letter-spacing:.6px">Priority</label>
            <select class="action-select" onchange="updatePriority(this.value)">
              ${["Critical","High","Medium","Low"].map(p => `<option value="${p}" ${t.priority===p?"selected":""}>${p}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="text-uppercase text-muted fw-semibold d-block mb-1" style="font-size:10px;letter-spacing:.6px">Category</label>
            <select id="expCategorySelect" class="action-select" onchange="expUpdateCategory(this.value)">
              ${["Bug","Task","Feature Request","Performance Issue","Account Issue","Other"].map(c => `<option value="${c}" ${c===t.category?"selected":""}>${c}</option>`).join("")}
            </select>
          </div>
          <button class="btn-danger-soft d-flex align-items-center gap-1 mt-3" onclick="doRemoveTicket()">
            <i class="bi bi-trash3"></i>Remove
          </button>
        </div>
      </div>

      <!-- Two-column body -->
      <div style="display:grid;grid-template-columns:1fr 420px;flex:1;overflow:hidden;min-height:0">

        <!-- LEFT -->
        <div class="p-4" style="overflow-y:auto;background:#fff;border-right:1px solid #e4e9f2">

          <!-- Editable title -->
          <div class="d-flex align-items-start gap-2 mb-2">
            <h5 class="fw-bold mb-0 flex-grow-1" id="expTitleDisplay" style="font-size:20px;line-height:1.35;color:#0f172a">${t.title}</h5>
            <button class="btn btn-sm btn-link p-0 text-muted" onclick="expEditTitle()" title="Edit title"><i class="bi bi-pencil"></i></button>
          </div>
          <input type="text" id="expTitleInput" class="form-control fw-bold d-none mb-2" value="${t.title}" style="font-size:18px;border:1px solid #3b7cf4;padding:8px 12px">

          <!-- Editable description -->
          <div class="d-flex align-items-center justify-content-between mb-1">
            <label class="text-uppercase text-muted fw-semibold mb-0" style="font-size:10.5px;letter-spacing:.6px">Description</label>
            <button class="btn btn-sm btn-link p-0 text-muted" onclick="expEditDesc()" title="Edit description"><i class="bi bi-pencil"></i></button>
          </div>
          <div class="detail-desc p-3 mb-3 rounded-3" id="expDescDisplay" style="font-size:14px;line-height:1.75">${t.desc}</div>
          <textarea id="expDescInput" class="form-control rounded-3 d-none mb-3" rows="4" style="font-size:13px;font-family:inherit;resize:vertical;border:1px solid #3b7cf4;padding:12px">${t.desc}</textarea>

          ${attachHTML}

          <div class="row g-3 mb-4">
            <div class="col-6">
              <div class="p-3 rounded-3 border" style="background:#f8fafc">
                <p class="text-uppercase fw-semibold mb-1" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Reporter</p>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-sm" style="width:22px;height:22px;font-size:9px;background:#e0e7ef;color:#3b3b4f;border-radius:7px">${initials(t.reporter||"?")}</div>
                  <span class="fw-semibold" style="font-size:13px">${t.reporter||"—"}</span>
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 rounded-3 border" style="background:#f8fafc">
                <p class="text-uppercase fw-semibold mb-1" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Manager</p>
                ${managerField}
              </div>
            </div>
            ${devField}
            <div class="col-6">
              <div class="p-3 rounded-3 border" style="background:#f8fafc">
                <p class="text-uppercase fw-semibold mb-1" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Created</p>
                <span class="fw-semibold" style="font-size:13px">${t.created}</span>
              </div>
            </div>
          </div>

          <p class="text-uppercase fw-semibold mb-3" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">Activity Log</p>
          ${actHTML}
        </div>

        <!-- RIGHT -->
        <div style="display:flex;flex-direction:column;background:#f5f7fb;overflow:hidden">
          <div style="flex:1;overflow-y:auto;padding:20px 20px 0">
            <p class="text-uppercase fw-semibold mb-3" style="font-size:10px;letter-spacing:.7px;color:#9aa5bc">
              Comments <span class="badge rounded-pill" style="background:#eef2ff;color:#3b7cf4;font-size:10px;text-transform:none;letter-spacing:0">${cms.length}</span>
            </p>
            ${commentsHTML}
          </div>
          ${notesSection}
          <div class="p-3 border-top flex-shrink-0" style="background:#fff">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="avatar-sm" style="background:#3b7cf4;color:#fff;width:26px;height:26px;font-size:10px">${initials(CURRENT_USER)}</div>
              <span class="fw-semibold" style="font-size:13px;color:#1a2235">${CURRENT_USER}</span>
            </div>
            <textarea id="expNewComment" class="form-control rounded-3 mb-2" rows="3"
              style="font-size:13px;font-family:inherit;resize:none"
              placeholder="Write a comment... (paste screenshot with Ctrl+V / ⌘V)"></textarea>
            <div class="screenshot-preview mb-2" id="expCommentPreview"></div>
            <div class="d-flex justify-content-end">
              <button class="btn btn-primary btn-sm px-4 rounded-2 fw-semibold" style="font-size:13px" onclick="expSubmitComment()">
                <i class="bi bi-send me-1"></i>Send
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>`;

  if (animate) {
    requestAnimationFrame(() => {
      const panel = document.getElementById("expPanel");
      if (panel) { panel.style.transform = "translateY(0)"; panel.style.opacity = "1"; }
    });
  }

  // Paste in comment box
  document.getElementById("expNewComment")?.addEventListener("paste", (e) => {
    const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith("image/")).map(i => i.getAsFile());
    if (imgs.length) { e.preventDefault(); addFiles(imgs, "comment"); }
  });

  // Wire inline selects
  _bindInlineSelect("expManagerDisplay", "expManagerSelect", t.manager, (val) => {
    t.manager = selectedTicket.manager = val;
    _logActivity(t, "manager", "changed manager to", val);
    NOTIFS.unshift(_notif("bi-person-check-fill","#e0e7ff","#3730a3",`Manager changed: ${t.id}`,`${CURRENT_USER} assigned to ${val}`,t.id));
    showToast({ type:"info", title:"Manager changed", message:`Assigned to ${val}` });
    saveTickets(); saveNotifs(); renderNotifList();
    IS_PM() ? pmRender() : clientRender();
    _refreshExpLeft();
  });

  if (IS_PM()) {
    _bindInlineSelect("expDeveloperDisplay", "expDeveloperSelect", t.developer, (val) => {
      t.developer = selectedTicket.developer = val;
      _logActivity(t, "developer", "changed developer to", val);
      NOTIFS.unshift(_notif("bi-person-badge","#e0f2fe","#0284c7","Developer changed",`${CURRENT_USER} changed developer to ${val} for ${t.id}`,t.id));
      showToast({ type:"info", title:"Developer changed", message:`Assigned to ${val}` });
      saveTickets(); saveNotifs(); renderNotifList(); pmRender();
      _refreshExpLeft();
    });
  }

}

function _refreshExpLeft() {
  const overlay = document.getElementById("ticketExpandedOverlay");
  if (!overlay || overlay.style.display === "none") return;
  const t = selectedTicket;
  const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
}

function renderExpandedView() {
  const overlay = document.getElementById("ticketExpandedOverlay");
  if (!overlay || overlay.style.display === "none") return;
  _renderExpHTML(overlay, false); // no animation on updates
}

function closeExpandedView() {
  const overlay = document.getElementById("ticketExpandedOverlay");
  const panel = document.getElementById("expPanel");
  if (!overlay) return;
  if (panel) { panel.style.transition = "transform .25s ease,opacity .25s ease"; panel.style.transform = "translateY(12px)"; panel.style.opacity = "0"; }
  setTimeout(() => { overlay.style.display = "none"; }, 260);
}

// Inline edit: title
function expEditTitle() {
  const display = document.getElementById("expTitleDisplay");
  const input   = document.getElementById("expTitleInput");
  if (!display || !input) return;
  display.classList.add("d-none"); input.classList.remove("d-none");
  input.focus(); input.select();
  const save = () => {
    const val = input.value.trim();
    if (!val) { input.value = selectedTicket.title; }
    else if (val !== selectedTicket.title) {
      updateTitle(val);
      // update display directly — no re-render needed
      display.textContent = val;
    }
    input.classList.add("d-none"); display.classList.remove("d-none");
  };
  input.onblur = save;
  input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } else if (e.key === "Escape") { input.value = selectedTicket.title; input.blur(); } };
}

// Inline edit: description
function expEditDesc() {
  const display = document.getElementById("expDescDisplay");
  const input   = document.getElementById("expDescInput");
  if (!display || !input) return;
  display.classList.add("d-none"); input.classList.remove("d-none");
  input.focus();
  const save = () => {
    const val = input.value.trim();
    if (!val) { input.value = selectedTicket.desc; }
    else if (val !== selectedTicket.desc) {
      updateDescription(val);
      // update display directly — no re-render needed
      display.textContent = val;
    }
    input.classList.add("d-none"); display.classList.remove("d-none");
  };
  input.onblur = save;
  input.onkeydown = (e) => { if (e.key === "Escape") { input.value = selectedTicket.desc; input.blur(); } };
}

function expUpdateCategory(val) {
  if (!selectedTicket || !val) return;
  const t = TICKETS.find(x => x.id === selectedTicket.id);
  if (!t) return;
  t.category = selectedTicket.category = val;
  _logActivity(t, "category", "set category to", val);
  NOTIFS.unshift(_notif("bi-tags-fill","#ede9fe","#6d28d9",`Category: ${t.id}`,`${CURRENT_USER} set category to ${val}`,t.id));
  showToast({ type:"info", title:"Category updated", message:`Set to ${val}` });
  saveTickets(); saveNotifs(); renderNotifList();
  IS_PM() ? pmRender() : clientRender();
  // Refresh the badge row in the header left
  const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
}

function expSubmitComment() {
  const txt = document.getElementById("expNewComment")?.value.trim();
  const atts = window.commentAttachments || [];
  if (!txt && !atts.length) return;
  // proxy text into offcanvas textarea so submitComment() picks it up
  const box = document.getElementById("newComment");
  if (box) box.value = txt || "";
  submitComment();
  // clear the expanded preview (submitComment already cleared commentPreview)
  const expPreview = document.getElementById("expCommentPreview");
  if (expPreview) expPreview.innerHTML = "";
  renderExpandedView();
}

function expAddNote() {
  const txt = document.getElementById("expNewNote")?.value.trim();
  if (!txt || !selectedTicket) return;
  NOTES[selectedTicket.id] = NOTES[selectedTicket.id] || [];
  NOTES[selectedTicket.id].unshift({ author: CURRENT_USER, time: _now(), text: txt });
  saveNotes();
  showToast({ type: "success", title: "Note added", message: "Internal note saved" });
  renderExpandedView();
}

window.openExpandedView = openExpandedView;
window.closeExpandedView = closeExpandedView;


// ── ATTACHMENTS ────────────────────────────────────────
window.ctAttachments = window.ctAttachments || [];
window.commentAttachments = window.commentAttachments || [];

function initScreenshots() {
  const dropZone = document.getElementById("ctDropZone");
  const fileInput = document.getElementById("ctFileInput");
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    addFiles(Array.from(e.target.files), "ct");
    fileInput.value = "";
  });
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("drag-over"),
  );
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    addFiles(
      Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      ),
      "ct",
    );
  });

  const createModal = document.getElementById("createTicketModal");
  if (createModal) {
    createModal.addEventListener("paste", (e) => {
      const imgs = Array.from(e.clipboardData.items)
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile());
      if (imgs.length) addFiles(imgs, "ct");
    });
  }

  const newComment = document.getElementById("newComment");
  if (newComment) {
    newComment.addEventListener("paste", (e) => {
      const imgs = Array.from(e.clipboardData.items)
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile());
      if (imgs.length) {
        e.preventDefault();
        addFiles(imgs, "comment");
      }
    });
  }
}

function addFiles(files, target) {
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (target === "ct") {
        window.ctAttachments.push(ev.target.result);
        renderPreviews(window.ctAttachments, "ctPreview", "ct");
      } else {
        window.commentAttachments.push(ev.target.result);
        renderPreviews(window.commentAttachments, "commentPreview", "comment");
        renderPreviews(window.commentAttachments, "expCommentPreview", "comment");
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(arr, cid, target) {
  const el = document.getElementById(cid);
  if (!el) return;
  el.innerHTML = arr
    .map(
      (src, i) => `
    <div class="screenshot-thumb">
      <img src="${src}" onclick="window.open().document.write('<img src=${JSON.stringify(src)} style=max-width:100%>')"/>
      <div class="remove-img" onclick="removeAttachment(${i},'${target}')"><i class="bi bi-x"></i></div>
    </div>`,
    )
    .join("");
}

function removeAttachment(i, target) {
  if (target === "ct") {
    window.ctAttachments.splice(i, 1);
    renderPreviews(window.ctAttachments, "ctPreview", "ct");
  } else {
    window.commentAttachments.splice(i, 1);
    renderPreviews(window.commentAttachments, "commentPreview", "comment");
    renderPreviews(window.commentAttachments, "expCommentPreview", "comment");
  }
}

// ── STORAGE HELPERS ────────────────────────────────────
function loadTicketsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_STORAGE_KEY)) || null;
  } catch (e) {
    return null;
  }
}
function saveTicketsToStorage(data) {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(data));
}
function loadNotifsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveNotifsToStorage(data) {
  localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(data));
}

// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════
const DEFAULT_TICKETS = [
  {
    id: "TK-001",
    reporter: "John Client",
    category: "Bug",
    title: "Website login page not responding",
    status: "Open",
    priority: "Critical",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 15, 2024",
    desc: "Users are unable to access the login page. The page loads but the login button becomes unresponsive after clicking.",
    comments: [
      {
        author: "John Client",
        role: "client",
        time: "Jan 15, 06:35 PM",
        text: "This is affecting all our users. Please prioritize.",
      },
      {
        author: "Sarah Johnson",
        role: "support",
        time: "Jan 15, 07:00 PM",
        text: "I've started investigating this issue. Will update you within 2 hours.",
      },
    ],
  },
  {
    id: "TK-002",
    reporter: "John Client",
    category: "Bug",
    title: "Mobile app crashes on iOS devices",
    status: "In Progress",
    priority: "High",
    manager: "Mike Torres",
    ac: "orange",
    created: "Jan 15, 2024",
    desc: "The mobile application crashes upon launch on devices running iOS 17.",
    comments: [
      {
        author: "Mike Torres",
        role: "support",
        time: "Jan 15, 05:00 PM",
        text: "Identified a memory leak in build 2.4.1. Patch incoming.",
      },
    ],
  },
  {
    id: "TK-003",
    reporter: "Maria Santos",
    category: "Bug",
    title: "Slow page load times on product catalog",
    status: "Resolved",
    priority: "Medium",
    manager: "Anna Lee",
    ac: "purple",
    created: "Jan 14, 2024",
    desc: "Product catalog page took over 8 seconds to load. Optimized via CDN and lazy loading.",
    comments: [
      {
        author: "Anna Lee",
        role: "support",
        time: "Jan 14, 03:00 PM",
        text: "Issue resolved. Load time is now under 1.2s.",
      },
    ],
  },
  {
    id: "TK-004",
    reporter: "John Client",
    category: "Bug",
    title: "Payment gateway integration errors",
    status: "Open",
    priority: "Critical",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 16, 2024",
    desc: "Payments via Stripe are failing with error code 402.",
    comments: [],
  },
  {
    id: "TK-005",
    reporter: "John Client",
    category: "Task",
    title: "Email notifications not sending",
    status: "In Progress",
    priority: "High",
    manager: "Mike Torres",
    ac: "orange",
    created: "Jan 16, 2024",
    desc: "Transactional email service stopped delivering notifications. SMTP logs show 550 errors.",
    comments: [
      {
        author: "John Client",
        role: "client",
        time: "Jan 16, 09:00 AM",
        text: "This is blocking our onboarding flow.",
      },
    ],
  },
  {
    id: "TK-006",
    reporter: "Maria Santos",
    category: "Bug",
    title: "Dashboard analytics showing incorrect data",
    status: "Open",
    priority: "Medium",
    manager: "Anna Lee",
    ac: "purple",
    created: "Jan 16, 2024",
    desc: "Revenue and session metrics appear duplicated in the analytics dashboard.",
    comments: [],
  },
  {
    id: "TK-007",
    reporter: "Carlos Reyes",
    category: "Bug",
    title: "Search feature returning no results",
    status: "In Progress",
    priority: "High",
    manager: "David Kim",
    ac: "green",
    created: "Jan 17, 2024",
    desc: "The site search returns 0 results for all queries.",
    comments: [
      {
        author: "David Kim",
        role: "support",
        time: "Jan 17, 10:00 AM",
        text: "Elasticsearch index appears corrupted. Re-indexing now.",
      },
    ],
  },
  {
    id: "TK-008",
    reporter: "Maria Santos",
    category: "Task",
    title: "User profile images not uploading",
    status: "Resolved",
    priority: "Low",
    manager: "Anna Lee",
    ac: "purple",
    created: "Jan 12, 2024",
    desc: "Profile picture upload was failing due to incorrect S3 bucket permissions.",
    comments: [],
  },
  {
    id: "TK-009",
    reporter: "John Client",
    category: "Bug",
    title: "Two-factor auth codes not delivered",
    status: "Open",
    priority: "Critical",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 17, 2024",
    desc: "SMS-based 2FA codes are not being sent. Users are locked out.",
    comments: [
      {
        author: "John Client",
        role: "client",
        time: "Jan 17, 08:00 AM",
        text: "Multiple enterprise accounts affected. This is urgent.",
      },
    ],
  },
  {
    id: "TK-010",
    reporter: "Carlos Reyes",
    category: "Task",
    title: "API rate limits too restrictive",
    status: "Closed",
    priority: "Medium",
    manager: "David Kim",
    ac: "green",
    created: "Jan 10, 2024",
    desc: "Rate limits adjusted. Increased to 1000 req/min for enterprise plans.",
    comments: [],
  },
  {
    id: "TK-011",
    reporter: "Carlos Reyes",
    category: "Bug",
    title: "CSV export corrupting special characters",
    status: "In Progress",
    priority: "Medium",
    manager: "Mike Torres",
    ac: "orange",
    created: "Jan 18, 2024",
    desc: "Exported CSV files show garbled text for accented characters or emojis.",
    comments: [],
  },
  {
    id: "TK-012",
    reporter: "John Client",
    category: "Bug",
    title: "Admin panel inaccessible after update",
    status: "Open",
    priority: "High",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 18, 2024",
    desc: "Following the v3.2 deployment, admin users receive a 403 error on login.",
    comments: [],
  },
  {
    id: "TK-013",
    reporter: "Carlos Reyes",
    category: "Task",
    title: "Webhook events not firing",
    status: "Resolved",
    priority: "High",
    manager: "David Kim",
    ac: "green",
    created: "Jan 11, 2024",
    desc: "Webhook endpoints were not receiving events due to an incorrect URL in config.",
    comments: [],
  },
  {
    id: "TK-014",
    reporter: "Maria Santos",
    category: "Task",
    title: "Onboarding wizard skipping steps",
    status: "In Progress",
    priority: "Low",
    manager: "Anna Lee",
    ac: "purple",
    created: "Jan 19, 2024",
    desc: "New users report the wizard skips from step 2 to step 5.",
    comments: [],
  },
  {
    id: "TK-015",
    reporter: "Carlos Reyes",
    category: "Bug",
    title: "Dark mode flickering on refresh",
    status: "Closed",
    priority: "Low",
    manager: "Mike Torres",
    ac: "orange",
    created: "Jan 9, 2024",
    desc: "White flash on page load in dark mode. Fixed by persisting theme in localStorage.",
    comments: [],
  },
  {
    id: "TK-016",
    reporter: "John Client",
    category: "Task",
    title: "Subscription renewal emails missing",
    status: "Open",
    priority: "High",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 19, 2024",
    desc: "Customers are not receiving renewal reminder emails 7 days before billing date.",
    comments: [],
  },
  {
    id: "TK-017",
    reporter: "Carlos Reyes",
    category: "Bug",
    title: "SSO login loop with SAML provider",
    status: "In Progress",
    priority: "Critical",
    manager: "David Kim",
    ac: "green",
    created: "Jan 20, 2024",
    desc: "Enterprise SAML SSO users are caught in an authentication redirect loop.",
    comments: [
      {
        author: "David Kim",
        role: "support",
        time: "Jan 20, 11:00 AM",
        text: "Working with the IdP team to debug the SAML assertion.",
      },
    ],
  },
  {
    id: "TK-018",
    reporter: "Maria Santos",
    category: "Task",
    title: "Bulk user import failing above 500 rows",
    status: "Resolved",
    priority: "Medium",
    manager: "Anna Lee",
    ac: "purple",
    created: "Jan 13, 2024",
    desc: "CSV imports over 500 rows timed out. Resolved with 200-row batch processing.",
    comments: [],
  },
  {
    id: "TK-019",
    reporter: "John Client",
    category: "Bug",
    title: "Audit log timestamps incorrect",
    status: "Open",
    priority: "Medium",
    manager: "Mike Torres",
    ac: "orange",
    created: "Jan 20, 2024",
    desc: "Audit logs recorded in UTC but displayed without timezone conversion.",
    comments: [],
  },
  {
    id: "TK-020",
    reporter: "John Client",
    category: "Bug",
    title: "Password reset link expiring instantly",
    status: "In Progress",
    priority: "High",
    manager: "Sarah Johnson",
    ac: "",
    created: "Jan 21, 2024",
    desc: "Password reset links expire before users can click them.",
    comments: [
      {
        author: "John Client",
        role: "client",
        time: "Jan 21, 07:00 AM",
        text: "This is blocking our new employee accounts.",
      },
    ],
  },
];

let TICKETS = loadTicketsFromStorage() || [];
let NOTIFS = loadNotifsFromStorage();
let NOTES = {};
let AGENTS = [];
let CLIENTS = [];
let commentsMap = {};
let selectedTicket = null;
let _offcanvas = null;

const NOTES_KEY = "servicedesk_internal_notes";
let CURRENT_USER =
  localStorage.getItem("servicedesk_current_user") || "Matthew Samson";

// ── STORAGE WRAPPERS ───────────────────────────────────
function saveTickets() {
  saveTicketsToStorage(TICKETS);
}
function saveNotifs() {
  saveNotifsToStorage(NOTIFS);
}
function saveAgents() {
  localStorage.setItem("servicedesk_agents", JSON.stringify(AGENTS));
}
function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(NOTES));
}
function saveClients() {
  localStorage.setItem("servicedesk_clients", JSON.stringify(CLIENTS));
}

function _loadAll() {
  TICKETS = loadTicketsFromStorage() || [];
  NOTIFS = loadNotifsFromStorage();
  try {
    NOTES = JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
  } catch (e) {
    NOTES = {};
  }
  try {
    AGENTS = JSON.parse(localStorage.getItem("servicedesk_agents")) || [
      "Sarah Johnson",
      "Alex Lee",
      "Priya Patel",
      "David Kim",
      "Emma Brown",
    ];
  } catch (e) {
    AGENTS = [
      "Sarah Johnson",
      "Alex Lee",
      "Priya Patel",
      "David Kim",
      "Emma Brown",
    ];
  }
  try {
    CLIENTS = JSON.parse(localStorage.getItem("servicedesk_clients")) || [];
  } catch (e) {
    CLIENTS = [];
  }
  TICKETS.forEach((t) => (commentsMap[t.id] = [...(t.comments || [])]));
}

// ── SHARED: STATS ──────────────────────────────────────
function renderStats() {
  const vis = IS_PM()
    ? TICKETS
    : TICKETS.filter((t) => t.reporter === CURRENT_USER);
  document.getElementById("statTotal").textContent = vis.length;
  document.getElementById("statOpen").textContent = vis.filter(
    (t) => t.status === "Open",
  ).length;
  document.getElementById("statProgress").textContent = vis.filter(
    (t) => t.status === "In Progress",
  ).length;
  document.getElementById("statResolved").textContent = vis.filter(
    (t) => t.status === "Resolved",
  ).length;
  const closedEl = document.getElementById("statClosed");
  const criticalEl = document.getElementById("statCritical");
  if (closedEl)
    closedEl.textContent = vis.filter((t) => t.status === "Closed").length;
  if (criticalEl)
    criticalEl.textContent = vis.filter(
      (t) => t.priority === "Critical" && t.status === "Open",
    ).length;
}

// ── CATEGORY BADGE ─────────────────────────────────────
function catBadge(c) {
  const bg = {
    Bug: "#ffe4e6",
    Task: "#eff4ff",
    "Feature Request": "#e0f2fe",
    "Performance Issue": "#fef9c3",
    "Account Issue": "#ede9fe",
    Other: "#f3e8ff",
  };
  const fg = {
    Bug: "#be123c",
    Task: "#3b7cf4",
    "Feature Request": "#0369a1",
    "Performance Issue": "#78350f",
    "Account Issue": "#6d28d9",
    Other: "#a21caf",
  };
  const icon = {
    Bug: "bi-bug",
    Task: "bi-list-task",
    "Feature Request": "bi-stars",
    "Performance Issue": "bi-speedometer2",
    "Account Issue": "bi-person-badge",
    Other: "bi-three-dots",
  };
  return `<span class="badge rounded-pill" style="background:${bg[c] || "#eff4ff"};color:${fg[c] || "#3b7cf4"};font-size:11px"><i class="bi ${icon[c] || "bi-check2-square"} me-1"></i>${c || "—"}</span>`;
}

// ── PALETTE ────────────────────────────────────────────
const PALETTE = [
  "#3b7cf4",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#dc2626",
  "#f59e42",
  "#0ea5e9",
  "#eab308",
  "#f43f5e",
  "#6366f1",
  "#14b8a6",
  "#f472b6",
  "#facc15",
  "#a21caf",
  "#059669",
];
function paletteColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ── TINY HELPERS ───────────────────────────────────────
function _now() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function _notif(icon, bg, fg, title, body, ticketId) {
  return {
    id: Date.now(),
    icon,
    bg,
    fg,
    title,
    body,
    ticketId,
    time: _now(),
    unread: true,
  };
}
function _logActivity(t, type, action, value) {
  t.activity = t.activity || [];
  t.activity.unshift({
    type,
    author: CURRENT_USER,
    action,
    value,
    time: _now(),
  });
}

// ── BOOT ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  _loadAll();
  _offcanvas = new bootstrap.Offcanvas(
    document.getElementById("ticketOffcanvas"),
  );
  initSidebar();
  initScreenshots();
  IS_PM() ? _bootPM() : _bootClient();
});

// ══════════════════════════════════════════════════════
// CLIENT BOOT
// ══════════════════════════════════════════════════════
function _bootClient() {
  const clientIdentifier = document.getElementById("clientIdentifier");
  if (clientIdentifier) clientIdentifier.textContent = CURRENT_USER;
  const clientUser = document.getElementById("clientUser");
  if (clientUser) clientUser.textContent = "· " + CURRENT_USER;
  const nameEl = document.querySelector(".user-info .fw-semibold");
  if (nameEl) nameEl.textContent = CURRENT_USER;
  const avatarEl = document.getElementById("clientAvatar");
  if (avatarEl) {
    avatarEl.textContent = initials(CURRENT_USER);
    avatarEl.title = CURRENT_USER + " – Client";
  }

  const ctReporter = document.getElementById("ctReporter");
  if (ctReporter) ctReporter.value = CURRENT_USER;

  const ctDeveloper = document.getElementById("ctDeveloper");
  if (ctDeveloper) {
    let agents = [];
    try {
      agents = JSON.parse(localStorage.getItem("servicedesk_agents")) || AGENTS;
    } catch (e) {
      agents = AGENTS;
    }
    ctDeveloper.innerHTML = agents
      .map((a) => `<option value="${a}">${a}</option>`)
      .join("");
  }
  const ctManager = document.getElementById("ctManager");
  if (ctManager) {
    const pms = JSON.parse(localStorage.getItem("servicedesk_pms")) || [
      "Matthew Samson",
      "John Doe",
    ];
    ctManager.innerHTML = pms
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");
  }

  const commentBox = document.getElementById("newComment");
  if (commentBox)
    commentBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });

  renderNotifList();
  clientRender();

  document.getElementById("filterStatus")?.addEventListener("change", (e) => {
    clientState.fStatus = e.target.value;
    clientState.page = 1;
    clientRender();
  });
  document.getElementById("filterPriority")?.addEventListener("change", (e) => {
    clientState.fPriority = e.target.value;
    clientState.page = 1;
    clientRender();
  });
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    clientState.fSearch = e.target.value.trim().toLowerCase();
    clientState.page = 1;
    clientRender();
  });
}

// ══════════════════════════════════════════════════════
// PM BOOT
// ══════════════════════════════════════════════════════
function _bootPM() {
  const pmNameEl = document.getElementById("pmName");
  if (pmNameEl) pmNameEl.textContent = CURRENT_USER;
  const pmAvatarEl =
    document.getElementById("pmAvatar") ||
    document.getElementById("clientAvatar");
  if (pmAvatarEl) {
    pmAvatarEl.textContent = initials(CURRENT_USER);
    pmAvatarEl.title = CURRENT_USER + " – Project Manager";
  }

  const commentBox = document.getElementById("newComment");
  if (commentBox)
    commentBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });

  ["filterStatus", "filterPriority", "filterClient", "filterManager"].forEach(
    (id) => {
      document.getElementById(id)?.addEventListener("change", () => {
        pmState.page = 1;
        pmRender();
      });
    },
  );


  // Populate create-ticket modal fields for PM view
  const ctReporter = document.getElementById("ctReporter");
  if (ctReporter) ctReporter.value = CURRENT_USER;

  const ctDeveloper = document.getElementById("ctDeveloper");
  if (ctDeveloper) {
    ctDeveloper.innerHTML = AGENTS.map((a) => `<option value="${a}">${a}</option>`).join("");
  }
  showSection("overview");
  renderNotifList();
}

// ══════════════════════════════════════════════════════
// SHARED: OPEN DETAIL
// ══════════════════════════════════════════════════════
function openDetail(id) {
  if (!id) return;
  selectedTicket = TICKETS.find((t) => t.id === id);
  if (!selectedTicket) return;
  const detailTid = document.getElementById("detailTid");
  if (detailTid) detailTid.textContent = selectedTicket.id;
  document.getElementById("detailStatus").value = selectedTicket.status;
  document.getElementById("detailPriority").value = selectedTicket.priority;
  document.getElementById("newComment").value = "";
  renderDetail();
  _offcanvas.show();

  // Wire expand button
  const expandBtn = document.getElementById("expandTicketBtn");
  if (expandBtn) {
    expandBtn.onclick = () => {
      _offcanvas.hide();
      setTimeout(() => openExpandedView(), 250);
    };
  }
}

// ══════════════════════════════════════════════════════
// SHARED: RENDER DETAIL PANEL
// ══════════════════════════════════════════════════════
function renderDetail() {
  const t = selectedTicket;
  const cms = commentsMap[t.id] || [];
  const nts = IS_PM() ? NOTES[t.id] || [] : [];

  const commentsHTML = cms.length
    ? cms
        .map(
          (c) => `
        <div class="d-flex gap-2 mb-3">
          <div class="avatar-sm ${c.role === "support" ? "green" : ""} flex-shrink-0">${initials(c.author)}</div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span class="fw-bold" style="font-size:12.5px">${c.author}</span>
              <span class="comment-role-badge ${c.role}">${c.role === "client" ? "Client" : "Support"}</span>
              <span class="text-muted ms-auto" style="font-size:11px">${c.time}</span>
            </div>
            <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${c.text}</p>
            ${c.attachments && c.attachments.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">${c.attachments.map((src) => `<img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}</div>` : ""}
          </div>
        </div>`,
        )
        .join("")
    : '<p class="text-muted mb-0" style="font-size:13px">No comments yet.</p>';

  const actHTML =
    t.activity && t.activity.length
      ? `<div class="mb-4"><h6 class="fw-bold mb-2" style="font-size:14px">Activity Log</h6>
        ${t.activity.map((a) => `<div style="font-size:12.5px;color:#7a8599;margin-bottom:6px"><span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action} <b>${a.value || ""}</b> <span style="font-size:11px;color:#bfc6d1">${a.time}</span></div>`).join("")}
       </div>`
      : "";

  let attachmentsHTML = "";
  if (t.attachments && t.attachments.length) {
    attachmentsHTML = `<div class="mb-3"><label class="form-label fw-semibold" style="font-size:13px">Attachments</label><div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${t.attachments.map((src) => `<img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}
    </div></div>`;
  }

  const managerOptions = IS_PM()
    ? (() => {
        let pms = [];
        try {
          pms = JSON.parse(localStorage.getItem("servicedesk_pms")) || [
            "Matthew Samson",
            "John Doe",
          ];
        } catch (e) {
          pms = ["Matthew Samson", "John Doe"];
        }
        return pms
          .map(
            (pm) =>
              `<option value="${pm}" ${pm === t.manager ? "selected" : ""}>${pm}</option>`,
          )
          .join("");
      })()
    : `<option value="Sarah Johnson">Sarah Johnson</option><option value="Alex Lee">Alex Lee</option><option value="Priya Patel">Priya Patel</option><option value="David Kim">David Kim</option><option value="Emma Brown">Emma Brown</option>`;

  const developerRow = IS_PM()
    ? `
    <div class="col-6">
      <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Developer</p>
      <div class="d-flex align-items-center gap-2">
        <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.developer || "?")}</div>
        <span id="developerDisplay" style="cursor:pointer;text-decoration:underline dotted;font-size:13px">${t.developer || "—"}</span>
        <select id="developerSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:130px;font-size:13px">
          ${AGENTS.map((a) => `<option value="${a}" ${a === t.developer ? "selected" : ""}>${a}</option>`).join("")}
        </select>
      </div>
    </div>`
    : "";

  const notesTab = IS_PM()
    ? `<li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabNotes" type="button" style="font-size:13px"><i class="bi bi-lock-fill me-1 text-warning" style="font-size:11px"></i>Internal Notes</button></li>`
    : "";
  const notesPane = IS_PM()
    ? `
    <div class="tab-pane fade" id="tabNotes">
      <div class="internal-badge"><i class="bi bi-lock-fill me-1"></i>PM Only — Not visible to client</div>
      ${nts.length ? nts.map((n) => `<div class="internal-note mb-2"><div class="internal-note-meta">🔒 ${n.author} · ${n.time}</div><div class="internal-note-text">${n.text}</div></div>`).join("") : '<p class="text-muted" style="font-size:13px">No internal notes yet.</p>'}
      <div class="mt-3">
        <label class="form-label">Add Internal Note</label>
        <textarea class="form-control rounded-3 mb-2" id="newNote" rows="2" style="font-size:13px;font-family:inherit;resize:none" placeholder="Private note for the team..."></textarea>
        <button class="btn btn-sm btn-outline-secondary rounded-2 fw-semibold" onclick="pmAddNote()"><i class="bi bi-plus me-1"></i>Add Note</button>
      </div>
    </div>`
    : "";

  // Capture active tab before re-render
  let activeTabTarget = null;
  const existingNav = document.getElementById("ticketTabNav");
  if (existingNav) {
    const cur = existingNav.querySelector(".nav-link.active");
    if (cur) activeTabTarget = cur.getAttribute("data-bs-target");
  }



  document.getElementById("detailBody").innerHTML = `
    <span class="ticket-id" style="font-family:'JetBrains Mono',monospace;margin-bottom:10px;display:inline-block">${t.id}</span>
    <div class="mb-2">
      <div class="d-flex align-items-start gap-2">
        <h5 class="fw-bold mb-0 flex-grow-1" id="titleDisplay" style="font-size:18px;line-height:1.3">${t.title}</h5>
        <button class="btn btn-sm btn-link p-0 text-muted" id="titleEditBtn" onclick="editTitle()" style="font-size:14px" title="Edit title">
          <i class="bi bi-pencil"></i>
        </button>
      </div>
      <input type="text" class="form-control form-control-sm fw-bold d-none" id="detailTitleInput" value="${t.title}" style="font-size:18px;line-height:1.3;border:1px solid #3b7cf4;padding:8px 12px">
    </div>
    <div class="d-flex gap-2 mb-3">${statusBadgeHTML(t.status)} ${prioBadgeHTML(t.priority)}</div>
    <div class="mb-3">
      <div class="d-flex align-items-center justify-content-between mb-1">
        <label class="text-uppercase text-muted fw-semibold mb-0" style="font-size:10.5px;letter-spacing:.6px">Description</label>
        <button class="btn btn-sm btn-link p-0 text-muted" id="descEditBtn" onclick="editDescription()" style="font-size:13px" title="Edit description">
          <i class="bi bi-pencil"></i>
        </button>
      </div>
      <div class="detail-desc p-3 rounded-3" id="descDisplay" style="background:#f8fafc;border:1px solid #e4e9f2;font-size:13px;line-height:1.6;white-space:pre-wrap">${t.desc}</div>
      <textarea class="form-control rounded-3 d-none" id="detailDescInput" rows="4" style="font-size:13px;font-family:inherit;resize:vertical;border:1px solid #3b7cf4;padding:12px">${t.desc}</textarea>
    </div>
    ${attachmentsHTML}
    <div class="row g-3 mb-3">
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Manager</p>
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-sm ${t.ac || ""}" style="width:22px;height:22px;font-size:9px">${initials(t.manager)}</div>
          <span id="managerDisplay" style="cursor:pointer;text-decoration:underline dotted;font-size:13px">${t.manager || "—"}</span>
          <select id="managerSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:130px;font-size:13px">${managerOptions}</select>
        </div>
      </div>
      ${developerRow}
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Created</p>
        <div class="fw-semibold" style="font-size:13px">${t.created}</div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Reporter</p>
        <div class="fw-semibold d-flex align-items-center gap-2" style="font-size:13px">
          <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter || "?")}</div>
          ${t.reporter || "—"}
        </div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Category</p>
        <div class="fw-semibold" style="font-size:13px">
          <span id="categoryDisplay" style="cursor:pointer;text-decoration:underline dotted">${t.category || "—"}</span>
          <select id="categorySelect" class="form-select form-select-sm d-none" style="width:auto;min-width:120px;font-size:13px">
            <option value="Bug">Bug</option><option value="Task">Task</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Performance Issue">Performance Issue</option>
            <option value="Account Issue">Account Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
    <ul class="nav nav-tabs mb-3" id="ticketTabNav" role="tablist">
      <li class="nav-item"><button class="nav-link active" id="tab-all" data-bs-toggle="tab" data-bs-target="#tabAll" type="button" style="font-size:13px">All</button></li>
      <li class="nav-item"><button class="nav-link" id="tab-worklog"         data-bs-toggle="tab" data-bs-target="#tabWorklog"  type="button" style="font-size:13px">Worklog</button></li>
      <li class="nav-item"><button class="nav-link" id="tab-comments"         data-bs-toggle="tab" data-bs-target="#tabComments"  type="button" style="font-size:13px">Comments</button></li>
      ${notesTab}
    </ul>
    <div class="tab-content" id="ticketTabContent">
      <div class="tab-pane fade show active" id="tabAll">
        ${actHTML}<p class="fw-bold mb-2 mt-1" style="font-size:13px">Comments (${cms.length})</p>${commentsHTML}
      </div>
      <div class="tab-pane fade" id="tabWorklog">${actHTML || '<p class="text-muted">No worklog yet.</p>'}</div>
      <div class="tab-pane fade" id="tabComments">
        <p class="fw-bold mb-2" style="font-size:13px">Comments (${cms.length})</p>${commentsHTML}
      </div>
      ${notesPane}
    </div>
  `;

  document.getElementById("detailStatus").value = t.status;
  document.getElementById("detailPriority").value = t.priority;

  if (activeTabTarget) {
    setTimeout(() => {
      const btn = document.querySelector(`#ticketTabNav [data-bs-target="${activeTabTarget}"]`);
      if (btn) new bootstrap.Tab(btn).show();
    }, 0);
  }

  const rb = document.getElementById("removeTicketBtn");
  if (rb)
    rb.style.display =
      t.status === "Resolved" || t.status === "Closed" ? "flex" : "none";

  _bindInlineSelect("managerDisplay", "managerSelect", t.manager, (newVal) => {
    t.manager = selectedTicket.manager = newVal;
    _logActivity(t, "manager", "changed manager to", newVal);
    NOTIFS.unshift(
      _notif(
        "bi-person-check-fill",
        "#e0e7ff",
        "#3730a3",
        `Manager changed: ${t.id}`,
        `${CURRENT_USER} assigned to ${newVal}`,
        t.id,
      ),
    );
    showToast({
      type: "info",
      title: "Manager changed",
      message: `${CURRENT_USER} assigned to ${newVal}`,
    });
    saveNotifs();
    renderNotifList();
    saveTickets();
    IS_PM() ? pmRender() : clientRender();
    renderDetail();
  });

  if (IS_PM()) {
    _bindInlineSelect(
      "developerDisplay",
      "developerSelect",
      t.developer,
      (newVal) => {
        t.developer = selectedTicket.developer = newVal;
        saveTickets();
        renderDetail();
        pmRender();
        NOTIFS.unshift(
          _notif(
            "bi-person-badge",
            "#e0f2fe",
            "#0284c7",
            "Developer changed",
            `${CURRENT_USER} changed developer to ${newVal} for ${t.id}`,
            t.id,
          ),
        );
        saveNotifs();
        renderNotifList();
        showToast({
          type: "info",
          title: "Developer Changed",
          message: `${CURRENT_USER} changed developer to ${newVal}`,
        });
      },
    );
  }

  _bindInlineSelect(
    "categoryDisplay",
    "categorySelect",
    t.category,
    (newVal) => {
      t.category = selectedTicket.category = newVal;
      const idx = TICKETS.findIndex((x) => x.id === t.id);
      if (idx !== -1) {
        TICKETS[idx].category = newVal;
        saveTickets();
      }
      NOTIFS.unshift(
        _notif(
          "bi-tags-fill",
          "#ede9fe",
          "#6d28d9",
          `Category: ${t.id}`,
          `${CURRENT_USER} set category to ${newVal}`,
          t.id,
        ),
      );
      renderNotifList();
      showToast({
        type: "info",
        title: "Category updated",
        message: `${CURRENT_USER} set to ${newVal}`,
      });
      IS_PM() ? pmRender() : clientRender();
      renderDetail();
    },
  );

  if (IS_PM()) {
    setTimeout(() => {
      const noteBox = document.getElementById("newNote");
      if (noteBox)
        noteBox.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            pmAddNote();
          }
        });
    }, 0);
  }
}

function _bindInlineSelect(displayId, selectId, currentVal, onChange) {
  const display = document.getElementById(displayId);
  const select = document.getElementById(selectId);
  if (!display || !select) return;
  display.onclick = () => {
    display.classList.add("d-none");
    select.classList.remove("d-none");
    select.value = currentVal || "";
    select.focus();
  };
  select.onblur = () => {
    select.classList.add("d-none");
    display.classList.remove("d-none");
  };
  select.onchange = function () {
    const newVal = select.value;
    select.classList.add("d-none");
    display.classList.remove("d-none");
    if (newVal !== currentVal) onChange(newVal);
  };
}

// ══════════════════════════════════════════════════════
// SHARED: STATUS / PRIORITY UPDATE
// ══════════════════════════════════════════════════════
function updateStatus(val) {
  if (!selectedTicket) return;
  const t = TICKETS.find((x) => x.id === selectedTicket.id);
  if (!t) return;
  const prev = t.status;
  t.status = selectedTicket.status = val;
  _logActivity(t, "status", "set status to", val);
  NOTIFS.unshift(
    _notif(
      "bi-arrow-clockwise",
      "#fef9c3",
      "#92400e",
      `Status: ${t.id}`,
      `${CURRENT_USER} set status to ${val}`,
      t.id,
    ),
  );
  showToast({
    type: "info",
    title: "Status updated",
    message: `${CURRENT_USER} changed status from ${prev} to ${val}`,
  });
  saveTickets();
  saveNotifs();
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
  const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
}

function updatePriority(val) {
  if (!selectedTicket) return;
  const t = TICKETS.find((x) => x.id === selectedTicket.id);
  if (!t) return;
  const prev = t.priority;
  t.priority = selectedTicket.priority = val;
  _logActivity(t, "priority", "set priority to", val);
  NOTIFS.unshift(
    _notif(
      "bi-flag-fill",
      "#ffedd5",
      "#9a3412",
      `Priority: ${t.id}`,
      `${CURRENT_USER} set priority to ${val}`,
      t.id,
    ),
  );
  showToast({
    type: "info",
    title: "Priority updated",
    message: `${CURRENT_USER} changed priority from ${prev} to ${val}`,
  });
  saveTickets();
  saveNotifs();
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
  const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
}

function editTitle() {
  const display = document.getElementById("titleDisplay");
  const input = document.getElementById("detailTitleInput");
  const btn = document.getElementById("titleEditBtn");
  
  if (display && input && btn) {
    display.classList.add("d-none");
    btn.classList.add("d-none");
    input.classList.remove("d-none");
    input.focus();
    input.select();
    
    const saveTitle = () => {
      const val = input.value.trim();
      if (!val) {
        showToast({
          type: "error",
          title: "Invalid title",
          message: "Title cannot be empty",
        });
        input.value = selectedTicket.title;
        return;
      }
      
      if (val !== selectedTicket.title) {
        updateTitle(val);
      } else {
        input.classList.add("d-none");
        display.classList.remove("d-none");
        btn.classList.remove("d-none");
      }
    };
    
    input.onblur = saveTitle;
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        input.value = selectedTicket.title;
        input.blur();
      }
    };
  }
}

function editDescription() {
  const display = document.getElementById("descDisplay");
  const input = document.getElementById("detailDescInput");
  const btn = document.getElementById("descEditBtn");
  
  if (display && input && btn) {
    display.classList.add("d-none");
    btn.classList.add("d-none");
    input.classList.remove("d-none");
    input.focus();
    input.select();
    
    const saveDesc = () => {
      const val = input.value.trim();
      if (!val) {
        showToast({
          type: "error",
          title: "Invalid description",
          message: "Description cannot be empty",
        });
        input.value = selectedTicket.desc;
        return;
      }
      
      if (val !== selectedTicket.desc) {
        updateDescription(val);
      } else {
        input.classList.add("d-none");
        display.classList.remove("d-none");
        btn.classList.remove("d-none");
      }
    };
    
    input.onblur = saveDesc;
    input.onkeydown = (e) => {
      if (e.key === "Escape") {
        input.value = selectedTicket.desc;
        input.blur();
      }
    };
  }
}

function updateTitle(val) {
  if (!selectedTicket) return;
  const t = TICKETS.find((x) => x.id === selectedTicket.id);
  if (!t) return;
  
  t.title = selectedTicket.title = val;
  _logActivity(t, "title", "updated title to", `"${val}"`);
  NOTIFS.unshift(
    _notif(
      "bi-pencil-fill",
      "#e0f2fe",
      "#075985",
      `Title: ${t.id}`,
      `${CURRENT_USER} updated the title`,
      t.id,
    ),
  );
  showToast({
    type: "success",
    title: "Title updated",
    message: `Title changed successfully`,
  });
  saveTickets();
  saveNotifs();
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
}

function updateDescription(val) {
  if (!selectedTicket) return;
  const t = TICKETS.find((x) => x.id === selectedTicket.id);
  if (!t) return;
  
  t.desc = selectedTicket.desc = val;
  _logActivity(t, "description", "updated description", "");
  NOTIFS.unshift(
    _notif(
      "bi-file-text-fill",
      "#f3e8ff",
      "#6b21a8",
      `Description: ${t.id}`,
      `${CURRENT_USER} updated the description`,
      t.id,
    ),
  );
  showToast({
    type: "success",
    title: "Description updated",
    message: `Description changed successfully`,
  });
  saveTickets();
  saveNotifs();
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
}

// ══════════════════════════════════════════════════════
// SHARED: SUBMIT COMMENT
// ══════════════════════════════════════════════════════
function submitComment() {
  const txt = document.getElementById("newComment").value.trim();
  const atts = window.commentAttachments || [];
  if (!txt && !atts.length) return;
  if (!selectedTicket) return;
  const now = _now();
  const role = IS_PM() ? "support" : "client";
  commentsMap[selectedTicket.id] = commentsMap[selectedTicket.id] || [];
  commentsMap[selectedTicket.id].push({
    author: CURRENT_USER,
    role,
    time: now,
    text: txt,
    attachments: [...atts],
  });
  const t = TICKETS.find((x) => x.id === selectedTicket.id);
  if (t) {
    t.comments = [...commentsMap[selectedTicket.id]];
    t.activity = t.activity || [];
    if (txt) {
      t.activity.unshift({
        type: "comment",
        author: CURRENT_USER,
        action: "commented",
        value: txt,
        time: now,
      });
      NOTIFS.unshift(
        _notif(
          "bi-chat-left-text-fill",
          "#f0fdf4",
          "#16a34a",
          `Comment on ${t.id}`,
          `${CURRENT_USER}: ${txt}`,
          t.id,
        ),
      );
      showToast({
        type: "info",
        title: "Comment added",
        message: `${CURRENT_USER} commented on ${t.id}`,
      });
    }
    if (atts.length) {
      t.activity.unshift({
        type: "attachment",
        author: CURRENT_USER,
        action: "added attachment(s)",
        value: `${atts.length} file(s)`,
        time: now,
      });
      NOTIFS.unshift({
        ..._notif(
          "bi-paperclip",
          "#e0e7ff",
          "#3730a3",
          `Attachment on ${t.id}`,
          `${CURRENT_USER} added ${atts.length} attachment(s)`,
          t.id,
        ),
        id: Date.now() + 1,
      });
      showToast({
        type: "info",
        title: "Attachment added",
        message: `${CURRENT_USER} added ${atts.length} file(s)`,
      });
    }
    renderNotifList();
  }
  saveTickets();
  saveNotifs();
  document.getElementById("newComment").value = "";
  window.commentAttachments = [];
  document.getElementById("commentPreview").innerHTML = "";
  renderDetail();
}

// ══════════════════════════════════════════════════════
// SHARED: REMOVE TICKET
// ══════════════════════════════════════════════════════
function doRemoveTicket() {
  if (!selectedTicket) return;
  if (
    selectedTicket.status !== "Resolved" &&
    selectedTicket.status !== "Closed"
  ) {
    const msg = document.getElementById("removeTicketModalMsg");
    if (msg)
      msg.textContent = "Only Resolved or Closed tickets can be removed.";
    new bootstrap.Modal(document.getElementById("removeTicketModal")).show();
    const warnEl = document.getElementById("removeTicketModal");
    warnEl.addEventListener("shown.bs.modal", () => {
      warnEl.style.zIndex = 1070;
      const backdrop = document.querySelector(".modal-backdrop:last-child");
      if (backdrop) backdrop.style.zIndex = 1065;
    }, { once: true });
    return;
  }
  const confirmEl = document.getElementById("confirmRemoveTicketModalMsg");
  if (confirmEl)
    confirmEl.textContent =
      "Are you sure you want to remove this ticket? This cannot be undone.";
  const confirmModal = new bootstrap.Modal(
    document.getElementById("confirmRemoveTicketModal"),
  );
  confirmModal.show();
  // Ensure modal appears above expanded view overlay (z-index 1060)
  const confirmModalEl = document.getElementById("confirmRemoveTicketModal");
  confirmModalEl.addEventListener("shown.bs.modal", () => {
    confirmModalEl.style.zIndex = 1070;
    const backdrop = document.querySelector(".modal-backdrop:last-child");
    if (backdrop) backdrop.style.zIndex = 1065;
  }, { once: true });
  const confirmBtn = document.getElementById("confirmRemoveTicketBtn");
  if (confirmBtn) {
    confirmBtn.onclick = function () {
      confirmModal.hide();
      const idx = TICKETS.findIndex((x) => x.id === selectedTicket.id);
      if (idx > -1) TICKETS.splice(idx, 1);
      NOTIFS.unshift(
        _notif(
          "bi-trash-fill",
          "#fee2e2",
          "#b91c1c",
          `Deleted: ${selectedTicket.id}`,
          `${CURRENT_USER} removed the ticket`,
          selectedTicket.id,
        ),
      );
      showToast({
        type: "error",
        title: "Ticket removed",
        message: `${CURRENT_USER} removed the ticket`,
      });
      saveTickets();
      saveNotifs();
      renderNotifList();
      _offcanvas.hide();
      closeExpandedView();
      selectedTicket = null;
      IS_PM() ? pmRender() : clientRender();
    };
  }
}

// ══════════════════════════════════════════════════════
// SHARED: NOTIFICATIONS
// ══════════════════════════════════════════════════════
function renderNotifList() {
  let visible = NOTIFS;
  if (!IS_PM()) {
    visible = NOTIFS.filter((n) => {
      if (!n.ticketId) return false;
      const t = TICKETS.find((x) => x.id === n.ticketId);
      return t && t.reporter === CURRENT_USER;
    });
  }
  const unread = visible.filter((n) => n.unread).length;
  document.getElementById("notifDot").style.display =
    unread > 0 ? "block" : "none";
  const listEl = document.getElementById("notifList");
  if (!listEl) return;
  listEl.innerHTML =
    visible.length === 0
      ? '<p class="text-muted text-center py-3 mb-0" style="font-size:13px">No notifications</p>'
      : visible
          .map((n) => {
            const tid = n.ticketId || n.title?.match(/TK-\d{3}/)?.[0] || "";
            return `<div class="notif-row ${n.unread ? "unread" : ""}" onclick="event.stopPropagation(); openDetail('${tid}')">
          <div class="notif-icon-sm" style="background:${n.bg};color:${n.fg}"><i class="bi ${n.icon}"></i></div>
          <div class="flex-grow-1">
            <div class="fw-semibold" style="font-size:12.5px;color:#1a2235">${n.title}</div>
            <div class="text-muted" style="font-size:12px;line-height:1.4">${n.body}</div>
            <div class="text-muted mt-1" style="font-size:11px"><i class="bi bi-clock me-1"></i>${n.time}</div>
          </div>
        </div>`;
          })
          .join("") +
        `<div class="text-center py-2 border-top"><span class="text-muted" style="font-size:12px">${unread} unread · ${visible.length} total</span></div>`;
  saveNotifs();
}
function markAllRead() {
  NOTIFS.forEach((n) => (n.unread = false));
  saveNotifs();
  renderNotifList();
}
function deleteAllNotifs() {
  NOTIFS.length = 0;
  saveNotifs();
  renderNotifList();
}

// ══════════════════════════════════════════════════════
// CLIENT: TABLE
// ══════════════════════════════════════════════════════
const clientState = {
  page: 1,
  sortField: "id",
  sortDir: 1,
  fStatus: "",
  fPriority: "",
  fSearch: "",
};

function getFiltered() {
  let list = [...TICKETS].filter((t) => t.reporter === CURRENT_USER);
  if (clientState.fStatus)
    list = list.filter((t) => t.status === clientState.fStatus);
  if (clientState.fPriority)
    list = list.filter((t) => t.priority === clientState.fPriority);
  if (clientState.fSearch)
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(clientState.fSearch) ||
        t.title.toLowerCase().includes(clientState.fSearch) ||
        (t.reporter || "").toLowerCase().includes(clientState.fSearch) ||
        t.manager.toLowerCase().includes(clientState.fSearch),
    );
  list.sort(
    (a, b) =>
      (a[clientState.sortField] || "").localeCompare(
        b[clientState.sortField] || "",
      ) * clientState.sortDir,
  );
  return list;
}
function sortBy(f) {
  clientState.sortDir =
    clientState.sortField === f ? clientState.sortDir * -1 : 1;
  clientState.sortField = f;
  clientState.page = 1;
  clientRender();
}
function goPage(p) {
  const pages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));
  if (p < 1 || p > pages) return;
  clientState.page = p;
  clientRender();
}

function clientRender() {
  const filtered = getFiltered(),
    total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (clientState.page > pages) clientState.page = pages;
  const from = (clientState.page - 1) * PAGE_SIZE,
    items = filtered.slice(from, from + PAGE_SIZE);

  renderStats();
  document.getElementById("ticketCountBadge").textContent = `${total} found`;
  document.getElementById("sidebarCount").textContent = TICKETS.filter(
    (t) => t.reporter === CURRENT_USER,
  ).length;

  const tbody = document.getElementById("ticketTableBody"),
    empty = document.getElementById("emptyState");
  if (!items.length) {
    tbody.innerHTML = "";
    empty.classList.remove("d-none");
  } else {
    empty.classList.add("d-none");
    tbody.innerHTML = items
      .map(
        (t) => `
      <tr onclick="openDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td>${statusBadgeHTML(t.status)}</td>
        <td>${prioBadgeHTML(t.priority)}</td>
        <td>${catBadge(t.category)}</td>
        <td style="font-size:12.5px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter)}</div><span>${t.reporter || "—"}</span></div></td>
        <td><div class="d-flex align-items-center gap-2"><div class="avatar-sm ${t.ac}">${initials(t.manager)}</div><span style="font-size:12.5px">${t.manager}</span></div></td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>`,
      )
      .join("");
  }
  document.getElementById("pageFrom").textContent = total ? from + 1 : 0;
  document.getElementById("pageTo").textContent = Math.min(
    from + PAGE_SIZE,
    total,
  );
  document.getElementById("pageTotal").textContent = total;
  document.getElementById("pageControls").innerHTML = renderPagination(
    clientState.page,
    total,
    "goPage",
  );
}

function submitTicket() {
  const title = document.getElementById("ctTitle").value.trim(),
    desc = document.getElementById("ctDesc").value.trim();
  if (!title || !desc) {
    alert("Title and Description are required.");
    return;
  }
  const maxId = TICKETS.reduce((m, t) => {
    const x = /TK-(\d+)/.exec(t.id);
    return x ? Math.max(m, +x[1]) : m;
  }, 0);
  const id = "TK-" + String(maxId + 1).padStart(3, "0");
  const now = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const manager = IS_PM()
    ? CURRENT_USER
    : document.getElementById("ctManager")?.value || "Sarah Johnson";
  TICKETS.unshift({
    id,
    title,
    status: "Open",
    priority: document.getElementById("ctPriority").value,
    category: document.getElementById("ctCategory").value,
    reporter: document.getElementById("ctReporter").value,
    manager,
    developer: document.getElementById("ctDeveloper")?.value || "",
    ac: "",
    created: now,
    desc,
    comments: [],
    attachments: [...window.ctAttachments],
  });
  commentsMap[id] = [];
  NOTIFS.unshift(
    _notif(
      "bi-plus-lg",
      "#e0f2fe",
      "#0284c7",
      `Ticket created: ${id}`,
      `${CURRENT_USER} created: ${title}`,
      id,
    ),
  );
  showToast({
    type: "success",
    title: "Ticket created",
    message: `${CURRENT_USER} created ${id}`,
  });
  saveTickets();
  saveNotifs();
  document.getElementById("ctTitle").value = document.getElementById(
    "ctDesc",
  ).value = "";
  window.ctAttachments = [];
  document.getElementById("ctPreview").innerHTML = "";
  bootstrap.Modal.getInstance(
    document.getElementById("createTicketModal"),
  ).hide();
  renderNotifList();
  IS_PM() ? (pmRender(), renderOverview()) : clientRender();
}

function exportCSV() {
  const rows = getFiltered().map((t) => [
    t.id,
    `"${t.title}"`,
    t.status,
    t.priority,
    t.manager,
    t.created,
  ]);
  const csv = [
    ["Ticket ID", "Title", "Status", "Priority", "Manager", "Created"],
    ...rows,
  ]
    .map((r) => r.join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv," + encodeURIComponent(csv);
  a.download = "support-tickets.csv";
  a.click();
}

// ══════════════════════════════════════════════════════
// PM: SECTION NAV
// ══════════════════════════════════════════════════════
const EXT_SECTIONS = [
  "overview",
  "tickets",
  "workload",
  "analytics",
  "clients",
];
function showSection(id, e) {
  if (e) e.preventDefault();
  EXT_SECTIONS.forEach((s) => {
    document.getElementById("sec-" + s)?.classList.add("d-none");
    document.getElementById("nav-" + s)?.classList.remove("active");
  });
  document.getElementById("sec-" + id)?.classList.remove("d-none");
  document.getElementById("nav-" + id)?.classList.add("active");
  const titles = {
    overview: "Dashboard",
    tickets: "All Tickets",
    workload: "Team Workload",
    analytics: "Analytics",
    clients: "Clients",
  };
  document.getElementById("topbarTitle").textContent = titles[id] || id;
  if (id === "overview") renderOverview();
  if (id === "tickets") pmRender();
  if (id === "workload") renderWorkload();
  if (id === "analytics") renderAnalytics();
  if (id === "clients") renderClients();
  return false;
}

// ══════════════════════════════════════════════════════
// PM: TABLE
// ══════════════════════════════════════════════════════
const pmState = { page: 1, sortField: "id", sortDir: 1, search: "" };
function onSearch(v) {
  pmState.search = v.trim().toLowerCase();
  pmState.page = 1;
  pmRender();
}
function sortBy(f) {
  pmState.sortDir = pmState.sortField === f ? -pmState.sortDir : 1;
  pmState.sortField = f;
  pmState.page = 1;
  pmRender();
}

function pmGetFiltered() {
  let list = [...TICKETS];
  const sf = document.getElementById("filterStatus")?.value || "",
    pf = document.getElementById("filterPriority")?.value || "",
    cf = document.getElementById("filterClient")?.value || "",
    af = document.getElementById("filterManager")?.value || "";
  if (sf) list = list.filter((t) => t.status === sf);
  if (pf) list = list.filter((t) => t.priority === pf);
  if (cf) list = list.filter((t) => t.reporter === cf);
  if (af) list = list.filter((t) => t.manager === af);
  if (pmState.search)
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(pmState.search) ||
        t.title.toLowerCase().includes(pmState.search) ||
        (t.reporter || "").toLowerCase().includes(pmState.search) ||
        t.manager.toLowerCase().includes(pmState.search),
    );
  return list.sort(
    (a, b) =>
      (a[pmState.sortField] || "").localeCompare(b[pmState.sortField] || "") *
      pmState.sortDir,
  );
}
function pmGoPage(p) {
  const total = Math.max(1, Math.ceil(pmGetFiltered().length / PAGE_SIZE));
  if (p < 1 || p > total) return;
  pmState.page = p;
  pmRender();
}

function pmRender() {
  const all = pmGetFiltered(),
    total = all.length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pmState.page > maxPage) pmState.page = maxPage;
  const start = (pmState.page - 1) * PAGE_SIZE,
    slice = all.slice(start, start + PAGE_SIZE);
  document.getElementById("ticketCountBadge").textContent = total + " found";
  document.getElementById("pageFrom").textContent = total ? start + 1 : 0;
  document.getElementById("pageTo").textContent = Math.min(
    start + PAGE_SIZE,
    total,
  );
  document.getElementById("pageTotal").textContent = total;
  document.getElementById("pageControls").innerHTML = renderPagination(
    pmState.page,
    total,
    "pmGoPage",
  );
  const cs = document.getElementById("filterClient");
  if (cs) {
    const prev = cs.value;
    cs.innerHTML =
      '<option value="">All Clients</option>' +
      Array.from(new Set(TICKETS.map((t) => t.reporter)))
        .filter(Boolean)
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");
    cs.value = prev;
  }
  const ms = document.getElementById("filterManager");
  if (ms) {
    const prev = ms.value;
    const pms = JSON.parse(localStorage.getItem("servicedesk_pms")) || [
      "Matthew Samson",
      "John Doe",
    ];
    ms.innerHTML =
      '<option value="">All Managers</option>' +
      pms.map((pm) => `<option value="${pm}">${pm}</option>`).join("");
    ms.value = prev;
  }
  const tbody = document.getElementById("ticketTableBody"),
    empty = document.getElementById("emptyState");
  if (!slice.length) {
    tbody.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");
  tbody.innerHTML = slice
    .map(
      (t) => `
    <tr onclick="openDetail('${t.id}')" style="cursor:pointer">
      <td><span class="ticket-id">${t.id}</span></td>
      <td class="fw-medium" style="color:#1a2235">${t.title}</td>
      <td>${statusBadgeHTML(t.status)}</td><td>${prioBadgeHTML(t.priority)}</td><td>${catBadge(t.category)}</td>
      <td style="font-size:12.5px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter || "?")}</div>${t.reporter || "—"}</div></td>
      <td style="font-size:13px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.manager || "?")}</div>${t.manager || "—"}</div></td>
      <td style="font-size:13px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.developer || "?")}</div>${t.developer || "—"}</div></td>
      <td class="text-muted" style="font-size:12px">${t.created}</td>
    </tr>`,
    )
    .join("");
  document.getElementById("sidebarOpenCount").textContent = TICKETS.length;
}

function quickReassign(id, agent) {
  const t = TICKETS.find((t) => t.id === id);
  if (!t) return;
  t.manager = agent;
  const time = _now();
  t.activity = t.activity || [];
  t.activity.unshift({
    type: "manager",
    author: CURRENT_USER,
    action: "reassigned to",
    value: agent,
    time,
  });
  NOTIFS.unshift({
    id: Date.now(),
    icon: "bi-person-check-fill",
    bg: "#e0e7ff",
    fg: "#3730a3",
    title: "Reassigned: " + id,
    body: CURRENT_USER + " assigned to " + agent,
    time,
    unread: true,
    ticketId: id,
  });
  saveTickets();
  saveNotifs();
  renderNotifList();
  pmRender();
  showToast({
    type: "info",
    title: "Reassigned",
    message: `${id}: assigned to ${agent}`,
  });
}

// ══════════════════════════════════════════════════════
// PM: OVERVIEW
// ══════════════════════════════════════════════════════
let charts = {};
function destroyChart(id) {
  if (charts[id]) {
    try {
      charts[id].destroy();
    } catch (e) {}
    delete charts[id];
  }
}

function renderOverview() {
  renderStats();
  const sidebarEl = document.getElementById("sidebarOpenCount");
  if (sidebarEl) sidebarEl.textContent = TICKETS.length;
  renderUrgentList();
  const feedEl = document.getElementById("activityFeed");
  if (feedEl) {
    const acts = [
      {
        icon: "bi-plus-lg",
        bg: "#e0f2fe",
        fg: "#0284c7",
        text: `<b>${CURRENT_USER}</b> opened PM Dashboard`,
        time: "Just now",
      },
      ...NOTIFS.slice(0, 7).map((n) => ({
        icon: n.icon,
        bg: n.bg,
        fg: n.fg,
        text: n.body,
        time: n.time,
      })),
    ];
    feedEl.innerHTML = acts
      .map(
        (a) =>
          `<div class="d-flex align-items-start gap-3 px-4 py-3 border-bottom"><div style="width:30px;height:30px;border-radius:8px;background:${a.bg};color:${a.fg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px"><i class="bi ${a.icon}"></i></div><div><div style="font-size:12.5px;color:#1a2235">${a.text}</div><div class="text-muted" style="font-size:11px">${a.time}</div></div></div>`,
      )
      .join("");
  }
  const open = TICKETS.filter((t) => t.status === "Open").length,
    inprog = TICKETS.filter((t) => t.status === "In Progress").length;
  const resolved = TICKETS.filter((t) => t.status === "Resolved").length,
    closed = TICKETS.filter((t) => t.status === "Closed").length;
  setTimeout(() => {
    destroyChart("chartStatus");
    destroyChart("chartPriority");
    destroyChart("chartCategory");
    charts.chartStatus = new Chart(document.getElementById("chartStatus"), {
      type: "doughnut",
      data: {
        labels: ["Open", "In Progress", "Resolved", "Closed"],
        datasets: [
          {
            data: [open, inprog, resolved, closed],
            backgroundColor: ["#3b7cf4", "#eab308", "#22c55e", "#94a3b8"],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: { family: "Plus Jakarta Sans", size: 12 },
              padding: 12,
            },
          },
        },
      },
    });
    charts.chartPriority = new Chart(document.getElementById("chartPriority"), {
      type: "bar",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [
          {
            data: ["Critical", "High", "Medium", "Low"].map(
              (p) => TICKETS.filter((t) => t.priority === p).length,
            ),
            backgroundColor: ["#ffe4e6", "#ffedd5", "#fef9c3", "#f0fdf4"],
            borderColor: ["#be123c", "#9a3412", "#78350f", "#14532d"],
            borderWidth: 1.5,
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    const cats = [
      "Bug",
      "Task",
      "Feature Request",
      "Performance Issue",
      "Account Issue",
      "Other",
    ];
    charts.chartCategory = new Chart(document.getElementById("chartCategory"), {
      type: "bar",
      data: {
        labels: cats.map((c) => (c.length > 10 ? c.substring(0, 10) + "…" : c)),
        datasets: [
          {
            data: cats.map(
              (c) => TICKETS.filter((t) => t.category === c).length,
            ),
            backgroundColor: "rgba(59,124,244,0.75)",
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }, 60);
}

function renderUrgentList() {
  const el = document.getElementById("urgentList");
  if (!el) return;
  const urgent = TICKETS.filter(
    (t) =>
      (t.priority === "Critical" || t.priority === "High") &&
      t.status === "Open",
  );
  if (!urgent.length) {
    el.innerHTML =
      '<div class="text-muted px-4 py-3" style="font-size:13px">No open Critical or High priority tickets.</div>';
    return;
  }
  el.innerHTML = urgent
    .map(
      (t) =>
        `<div class="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style="cursor:pointer" onclick="openDetail('${t.id}')"><div class="avatar-sm" style="background:${t.priority === "Critical" ? "#ffe4e6" : "#ffedd5"};color:${t.priority === "Critical" ? "#be123c" : "#9a3412"};width:28px;height:28px;font-size:11px;border-radius:8px;font-weight:700">${t.priority[0]}</div><div class="flex-grow-1"><div class="fw-semibold" style="font-size:13.5px;color:#1a2235">${t.title}</div><div class="d-flex gap-2 align-items-center" style="font-size:12px">${prioBadgeHTML(t.priority)}<span class="badge rounded-pill" style="background:#141d22">#${t.id}</span><span class="badge rounded-pill" style="background:#7c8f99">${t.reporter || "—"}</span></div></div><div class="text-muted" style="font-size:12px">${t.created || ""}</div></div>`,
    )
    .join("");
}

// ══════════════════════════════════════════════════════
// PM: INTERNAL NOTE
// ══════════════════════════════════════════════════════
function pmAddNote() {
  const txt = document.getElementById("newNote")?.value.trim();
  if (!txt || !selectedTicket) return;
  const time = _now();
  NOTES[selectedTicket.id] = NOTES[selectedTicket.id] || [];
  NOTES[selectedTicket.id].unshift({ author: CURRENT_USER, time, text: txt });
  saveNotes();
  renderDetail();
  showToast({
    type: "success",
    title: "Note added",
    message: "Internal note saved",
  });
}

// ══════════════════════════════════════════════════════
// PM: EDIT TICKET
// ══════════════════════════════════════════════════════
function pmSaveEdit() {
  const t = TICKETS.find((x) => x.id === selectedTicket?.id);
  if (!t) return;
  t.title = selectedTicket.title =
    document.getElementById("editTitle").value.trim() || t.title;
  t.status = selectedTicket.status =
    document.getElementById("editStatus").value;
  t.priority = selectedTicket.priority =
    document.getElementById("editPriority").value;
  t.reporter = selectedTicket.reporter =
    document.getElementById("editReporter").value;
  t.category = selectedTicket.category =
    document.getElementById("editCategory").value;
  t.desc = selectedTicket.desc =
    document.getElementById("editDesc").value.trim() || t.desc;
  const time = _now();
  t.activity = t.activity || [];
  t.activity.unshift({
    type: "edit",
    author: CURRENT_USER,
    action: "edited ticket",
    value: "",
    time,
  });
  NOTIFS.unshift(
    _notif(
      "bi-pencil-fill",
      "#e0e7ff",
      "#3730a3",
      "Edited: " + t.id,
      `${CURRENT_USER} edited the ticket`,
      t.id,
    ),
  );
  saveTickets();
  saveNotifs();
  document.getElementById("detailStatus").value = t.status;
  document.getElementById("detailPriority").value = t.priority;
  renderDetail();
  renderNotifList();
  if (document.getElementById("sec-tickets")?.offsetParent !== null) pmRender();
  showToast({
    type: "success",
    title: "Ticket updated",
    message: `${t.id} saved successfully`,
  });
}

// ══════════════════════════════════════════════════════
// PM: WORKLOAD
// ══════════════════════════════════════════════════════
window.saveAgentName = function (oldName, newName) {
  const idx = AGENTS.indexOf(oldName);
  if (idx !== -1) {
    AGENTS[idx] = newName;
    TICKETS.forEach((t) => {
      if (t.manager === oldName) t.manager = newName;
    });
    saveTickets();
    saveAgents();
    pmRender();
    renderWorkload();
    showToast({
      type: "success",
      title: "Updated",
      message: `${oldName} → ${newName}`,
    });
  }
};
window.addAgent = function (name) {
  if (!AGENTS.includes(name)) {
    AGENTS.push(name);
    saveAgents();
    renderWorkload();
    showToast({ type: "success", title: "Added", message: `${name} added` });
  } else {
    showToast({
      type: "warning",
      title: "Exists",
      message: `${name} already exists`,
    });
  }
};
window.removeAgent = function (name) {
  const idx = AGENTS.indexOf(name);
  if (idx !== -1) {
    AGENTS.splice(idx, 1);
    saveAgents();
    TICKETS.forEach((t) => {
      if (t.manager === name) t.manager = "";
    });
    saveTickets();
    pmRender();
    renderWorkload();
    showToast({ type: "info", title: "Removed", message: `${name} removed` });
  }
};

function renderWorkload() {
  const acEl = document.getElementById("agentCards"),
    wlEl = document.getElementById("workloadTableBody");
  const agentStats = (agent) => {
    const my = TICKETS.filter((t) => t.developer === agent),
      op = my.filter((t) => t.status === "Open").length,
      ip = my.filter((t) => t.status === "In Progress").length,
      rs = my.filter((t) => t.status === "Resolved").length,
      cl = my.filter((t) => t.status === "Closed").length;
    const util = Math.min(100, Math.round(((op + ip) / 6) * 100)),
      uc = util < 40 ? "#16a34a" : util < 75 ? "#d97706" : "#dc2626";
    return { my, op, ip, rs, cl, util, uc };
  };
  acEl.innerHTML = AGENTS.map((agent) => {
    const { op, ip, rs, cl, util, uc } = agentStats(agent);
    return `<div class="col-4"><div class="agent-card agent-card-clickable" onclick="openAgentModal('${agent}')"><div class="d-flex align-items-center gap-3 mb-3"><div class="agent-avatar" style="background:${paletteColor(agent)}">${initials(agent)}</div><div><div class="fw-bold" style="font-size:14px;color:#1a2235">${agent}</div><div class="text-muted" style="font-size:11.5px">Developer</div></div></div><div class="row g-2 mb-3 text-center"><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#3b7cf4;font-family:'JetBrains Mono',monospace">${op}</div><div class="text-muted" style="font-size:10.5px">Open</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#d97706;font-family:'JetBrains Mono',monospace">${ip}</div><div class="text-muted" style="font-size:10.5px">In Prog.</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#16a34a;font-family:'JetBrains Mono',monospace">${rs}</div><div class="text-muted" style="font-size:10.5px">Resolved</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#64748b;font-family:'JetBrains Mono',monospace">${cl}</div><div class="text-muted" style="font-size:10.5px">Closed</div></div></div><div class="d-flex justify-content-between mb-1"><span style="font-size:11.5px;color:#7a8599">Utilization</span><span style="font-size:11.5px;font-weight:700;color:${uc}">${util}%</span></div><div class="util-bar-wrap"><div class="util-bar" style="width:${util}%;background:${uc}"></div></div></div></div>`;
  }).join("");
  wlEl.innerHTML = AGENTS.map((agent) => {
    const { my, op, ip, rs, cl, util } = agentStats(agent);
    return `<tr><td><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:${paletteColor(agent)};width:28px;height:28px;font-size:10px">${initials(agent)}</div><span class="fw-semibold" style="font-size:13px">${agent}</span></div></td><td><span class="wl-stat">${my.length}</span></td><td><span class="wl-stat" style="color:#3b7cf4">${op}</span></td><td><span class="wl-stat" style="color:#d97706">${ip}</span></td><td><span class="wl-stat" style="color:#16a34a">${rs}</span></td><td><span class="wl-stat" style="color:#64748b">${cl}</span></td><td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:6px"><div class="progress-bar" style="width:${util}%;background:${paletteColor(agent)}"></div></div><span style="font-size:12px;font-weight:700;min-width:36px">${util}%</span></div></td></tr>`;
  }).join("");
}

// ══════════════════════════════════════════════════════
// PM: ANALYTICS
// ══════════════════════════════════════════════════════
function renderAnalytics() {
  const total = TICKETS.length,
    done = TICKETS.filter((t) =>
      ["Resolved", "Closed"].includes(t.status),
    ).length,
    critOp = TICKETS.filter(
      (t) => t.priority === "Critical" && t.status === "Open",
    ).length;
  document.getElementById("anTotal").textContent = total;
  document.getElementById("anRate").textContent = total
    ? Math.round((done / total) * 100) + "%"
    : "0%";
  document.getElementById("anCritOpen").textContent = critOp;
  setTimeout(() => {
    ["chartClient", "chartAgent", "chartTrend"].forEach((id) =>
      destroyChart(id),
    );
    const clients = Array.from(new Set(TICKETS.map((t) => t.reporter))).filter(
      Boolean,
    );
    charts.chartClient = new Chart(document.getElementById("chartClient"), {
      type: "bar",
      data: {
        labels: clients.map((c) => c.split(" ")[0]),
        datasets: [
          {
            label: "Tickets",
            data: clients.map(
              (c) => TICKETS.filter((t) => t.reporter === c).length,
            ),
            backgroundColor: clients.map((c) => paletteColor(c)),
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    charts.chartAgent = new Chart(document.getElementById("chartAgent"), {
      type: "bar",
      data: {
        labels: AGENTS.map((a) => a.split(" ")[0]),
        datasets: [
          {
            label: "Resolved/Closed",
            data: AGENTS.map(
              (a) =>
                TICKETS.filter(
                  (t) =>
                    t.manager === a &&
                    ["Resolved", "Closed"].includes(t.status),
                ).length,
            ),
            backgroundColor: AGENTS.map((a) => paletteColor(a)),
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }
    charts.chartTrend = new Chart(document.getElementById("chartTrend"), {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "Opened",
            data: [2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 2, 3, 1, 2],
            borderColor: "#dc2626",
            backgroundColor: "rgba(220,38,38,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: "Resolved",
            data: [0, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1],
            borderColor: "#16a34a",
            backgroundColor: "rgba(22,163,74,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } },
        },
      },
    });
  }, 60);
}

// ══════════════════════════════════════════════════════
// PM: CLIENTS
// ══════════════════════════════════════════════════════
window.openAddClientModal = function () {
  document.getElementById("addClientModalContainer").innerHTML =
    `<div class="modal fade" id="addClientModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Add Client</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><input type="text" id="newClientName" class="form-control" placeholder="Client name"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn btn-primary" onclick="addClient()">Add Client</button></div></div></div></div>`;
  new bootstrap.Modal(document.getElementById("addClientModal")).show();
};
window.addClient = function () {
  const name = document.getElementById("newClientName").value.trim();
  if (!name)
    return showToast({
      type: "warning",
      title: "Missing Name",
      message: "Client name required",
    });
  if (CLIENTS.includes(name))
    return showToast({
      type: "warning",
      title: "Exists",
      message: `${name} already a client`,
    });
  CLIENTS.push(name);
  saveClients();
  renderClients();
  bootstrap.Modal.getInstance(
    document.getElementById("addClientModal"),
  )?.hide();
  showToast({ type: "success", title: "Added", message: `${name} added` });
};
window.saveClientName = function (oldEnc, newName) {
  const old = decodeURIComponent(oldEnc);
  newName = newName.trim();
  if (!newName)
    return showToast({
      type: "warning",
      title: "Missing Name",
      message: "Required",
    });
  if (CLIENTS.includes(newName))
    return showToast({
      type: "warning",
      title: "Exists",
      message: `${newName} already exists`,
    });
  const idx = CLIENTS.indexOf(old);
  if (idx !== -1) {
    CLIENTS[idx] = newName;
    TICKETS.forEach((t) => {
      if (t.reporter === old) t.reporter = newName;
    });
    saveClients();
    saveTickets();
    renderClients();
    showToast({
      type: "success",
      title: "Updated",
      message: `${old} → ${newName}`,
    });
  }
};
window.openDeleteClientModal = function (enc) {
  const c = decodeURIComponent(enc);
  document.getElementById("addClientModalContainer").innerHTML =
    `<div class="modal fade" id="deleteClientModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Delete Client</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">Delete <b>${c}</b>?</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn btn-danger" onclick="removeClientConfirmed('${encodeURIComponent(c)}')">Delete</button></div></div></div></div>`;
  new bootstrap.Modal(document.getElementById("deleteClientModal")).show();
};
window.removeClientConfirmed = function (enc) {
  const c = decodeURIComponent(enc);
  const idx = CLIENTS.indexOf(c);
  if (idx !== -1) {
    CLIENTS.splice(idx, 1);
    saveClients();
    renderClients();
    showToast({ type: "info", title: "Removed", message: `${c} removed` });
  }
  bootstrap.Modal.getInstance(
    document.getElementById("deleteClientModal"),
  )?.hide();
};

function renderClients() {
  const ccEl = document.getElementById("clientCards");
  if (ccEl)
    ccEl.innerHTML = CLIENTS.map((client) => {
      const my = TICKETS.filter((t) => t.reporter === client),
        op = my.filter((t) => t.status === "Open").length,
        ip = my.filter((t) => t.status === "In Progress").length,
        rs = my.filter((t) => t.status === "Resolved").length,
        cl = my.filter((t) => t.status === "Closed").length;
      return `<div class="col-4"><div class="agent-card client-card-clickable" style="cursor:pointer" onclick="openClientModal('${encodeURIComponent(client)}')"><div class="d-flex align-items-center gap-3 mb-3"><div class="agent-avatar" style="background:${paletteColor(client)}">${initials(client)}</div><div><div class="fw-bold" style="font-size:14px;color:#1a2235">${client}</div><div class="text-muted" style="font-size:11.5px">Client</div></div></div><div class="row g-2 mb-3 text-center"><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#3b7cf4;font-family:'JetBrains Mono',monospace">${op}</div><div class="text-muted" style="font-size:10.5px">Open</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#d97706;font-family:'JetBrains Mono',monospace">${ip}</div><div class="text-muted" style="font-size:10.5px">In Prog.</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#16a34a;font-family:'JetBrains Mono',monospace">${rs}</div><div class="text-muted" style="font-size:10.5px">Resolved</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#64748b;font-family:'JetBrains Mono',monospace">${cl}</div><div class="text-muted" style="font-size:10.5px">Closed</div></div></div></div></div>`;
    }).join("");
  const wlEl = document.getElementById("clientTableBody");
  if (wlEl)
    wlEl.innerHTML = CLIENTS.map((client) => {
      const my = TICKETS.filter((t) => t.reporter === client),
        op = my.filter((t) => t.status === "Open").length,
        ip = my.filter((t) => t.status === "In Progress").length,
        rs = my.filter((t) => t.status === "Resolved").length,
        cl = my.filter((t) => t.status === "Closed").length;
      return `<tr style="cursor:pointer" onclick="openClientModal('${encodeURIComponent(client)}')"><td><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:${paletteColor(client)};width:28px;height:28px;font-size:10px">${initials(client)}</div><span class="fw-semibold" style="font-size:13px">${client}</span></div></td><td><span class="wl-stat">${my.length}</span></td><td><span class="wl-stat" style="color:#3b7cf4">${op}</span></td><td><span class="wl-stat" style="color:#d97706">${ip}</span></td><td><span class="wl-stat" style="color:#16a34a">${rs}</span></td><td><span class="wl-stat" style="color:#64748b">${cl}</span></td></tr>`;
    }).join("");
}

// ══════════════════════════════════════════════════════
// PM: MODALS (agent/client edit)
// ══════════════════════════════════════════════════════
window.openClientModal = function (enc) {
  const name = decodeURIComponent(enc);
  document.getElementById("clientModalContainer").innerHTML =
    `<div class="modal fade" id="editClientModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content rounded-3 border-0 shadow"><div class="modal-header"><h6 class="modal-title fw-bold">Edit Client</h6><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="mb-3"><label class="form-label">Name</label><input type="text" class="form-control" id="editClientName" value="${name}"></div><div class="d-flex justify-content-between"><button class="btn btn-danger" id="removeClientBtn">Delete</button><button class="btn btn-primary" id="saveClientBtn">Save</button></div></div></div></div></div>`;
  const modal = new bootstrap.Modal(document.getElementById("editClientModal"));
  modal.show();
  document.getElementById("saveClientBtn").onclick = function () {
    const n = document.getElementById("editClientName").value.trim();
    if (n && n !== name) {
      window.saveClientName(encodeURIComponent(name), n);
      modal.hide();
    }
  };
  document.getElementById("removeClientBtn").onclick = function () {
    window.openDeleteClientModal(encodeURIComponent(name));
    modal.hide();
  };
};
window.openAgentModal = function (agent) {
  document.getElementById("agentModalContainer").innerHTML =
    `<div class="modal fade" id="editAgentModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content rounded-3 border-0 shadow"><div class="modal-header"><h6 class="modal-title fw-bold">Edit Developer</h6><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="mb-3"><label class="form-label">Name</label><input type="text" class="form-control" id="editAgentName" value="${agent}"></div><div class="d-flex justify-content-between"><button class="btn btn-danger" id="removeAgentBtn">Remove</button><button class="btn btn-primary" id="saveAgentBtn">Save</button></div></div></div></div></div>`;
  const modal = new bootstrap.Modal(document.getElementById("editAgentModal"));
  modal.show();
  document.getElementById("saveAgentBtn").onclick = function () {
    const n = document.getElementById("editAgentName").value.trim();
    if (n && n !== agent) {
      window.saveAgentName(agent, n);
      modal.hide();
    }
  };
  document.getElementById("removeAgentBtn").onclick = function () {
    window.removeAgent(agent);
    modal.hide();
  };
};
window.openAddAgentModal = function () {
  document.getElementById("addAgentModalContainer").innerHTML =
    `<div class="modal fade" id="addAgentModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content rounded-3 border-0 shadow"><div class="modal-header"><h6 class="modal-title fw-bold">Add Developer</h6><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="mb-3"><label class="form-label">Name</label><input type="text" class="form-control" id="addAgentName" placeholder="Enter name"></div><div class="d-flex justify-content-end"><button class="btn btn-primary" id="addAgentBtn">Add</button></div></div></div></div></div>`;
  const modal = new bootstrap.Modal(document.getElementById("addAgentModal"));
  modal.show();
  const input = document.getElementById("addAgentName"),
    btn = document.getElementById("addAgentBtn");
  btn.onclick = function () {
    const n = input.value.trim();
    if (n) {
      window.addAgent(n);
      modal.hide();
    }
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btn.click();
    }
  });
};