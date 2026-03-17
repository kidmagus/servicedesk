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

// Will link
function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  return text.replace(urlRegex, (url) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#3b7cf4;word-break:break-all">${url}</a>`
  );
}

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
  _expandedViewOpen = true;
  _offcanvas.hide();

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeExpandedView();
    }
  })
 
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
          <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${linkify(c.text)}</p>
          ${c.attachments && c.attachments.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">${c.attachments.map(src => `<img src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}</div>` : ""}
        </div>
      </div>`).join("")
    : '<p class="text-muted" style="font-size:13px">No comments yet.</p>';

  const actHTML = t.activity && t.activity.length
    ? t.activity.map((a) => `
      <div style="font-size:12.5px;color:#7a8599;margin-bottom:8px;padding-left:14px;border-left:2px solid #e4e9f2; display: grid; grid-template-columns: 1fr 200px;">
        <div>
        <span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action}
        ${a.value ? `<strong>${a.value}</strong>` : ""}
        </div>
        <span class="ms-auto" style="font-size:11px; margin-left:6px">${a.time}</span>
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
    <div class="avatar-sm" style="width:22px;height:22px;font-size:9px;background:#16a34a;color:#fff;border-radius:7px">${initials(t.manager)}</div>
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
      <div style="display:grid;grid-template-columns:1fr 1fr;flex:1;overflow:hidden;min-height:0">

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
                  <div class="avatar-sm ${t.role === "support" ? "green": "" } " style="width:22px;height:22px;font-size:9px;background:#e0e7ef;color:#3b3b4f;border-radius:7px">${initials(t.reporter||"?")}</div>
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
          <div style="max-height: 405px; overflow-y: auto;"> ${actHTML} </div>
         
        </div>

        <!-- RIGHT -->
        <div style="display:flex;flex-direction:column;background:#f5f7fb;overflow:hidden">

          <!-- Tab nav -->
          <div class="flex-shrink-0 px-3 pt-3" style="background:#f5f7fb;border-bottom:1px solid #e4e9f2">
            <div class="d-flex gap-1">
              <button id="expTabBtnComments" onclick="expSwitchTab('comments')"
                style="font-size:12.5px;font-weight:600;padding:6px 14px;border:none;border-radius:8px 8px 0 0;background:#fff;color:#3b7cf4;border-bottom:2px solid #3b7cf4;cursor:pointer">
                Comments
                <span class="badge rounded-pill ms-1" style="background:#eef2ff;color:#3b7cf4;font-size:10px">${cms.length}</span>
              </button>
              ${IS_PM() ? `<button id="expTabBtnNotes" onclick="expSwitchTab('notes')"
                style="font-size:12.5px;font-weight:600;padding:6px 14px;border:none;border-radius:8px 8px 0 0;background:transparent;color:#9aa5bc;border-bottom:2px solid transparent;cursor:pointer">
                <i class="bi bi-lock-fill me-1" style="color:#f59e0b;font-size:10px"></i>Internal
                <span class="badge rounded-pill ms-1" style="background:#fef9c3;color:#92400e;font-size:10px">${nts.length}</span>
              </button>` : ""}
            </div>
          </div>

          <!-- Comments tab -->
          <div id="expTabComments" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
            <div style="flex:1;overflow-y:auto;padding:20px">
              ${commentsHTML}
            </div>
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

          <!-- Internal Notes tab (PM only) -->
          ${IS_PM() ? `<div id="expTabNotes" style="flex:1;display:none;flex-direction:column;overflow:hidden;background:#fffbeb">
            <div style="flex:1;overflow-y:auto;padding:20px">
              <div class="internal-badge mb-3"><i class="bi bi-lock-fill me-1"></i>PM Only — Not visible to client</div>
              ${nts.length ? nts.map(n => `
                <div class="rounded-2 p-2 mb-2" style="background:#fff;border:1px solid #fde68a">
                  <div style="font-size:11px;color:#92400e;font-weight:600;margin-bottom:3px">🔒 ${n.author} · ${n.time}</div>
                  <div style="font-size:13px;color:#3a4560">${n.text}</div>
                </div>`).join("") : '<p class="text-muted mb-2" style="font-size:13px">No internal notes yet.</p>'}
            </div>
            <div class="p-3 border-top flex-shrink-0" style="background:#fffbeb">
              <textarea id="expNewNote" class="form-control form-control-sm rounded-2 mb-2" rows="2"
                style="font-size:13px;font-family:inherit;resize:none" placeholder="Add a private note..."></textarea>
              <button class="btn btn-sm btn-outline-secondary rounded-2 fw-semibold" onclick="expAddNote()">
                <i class="bi bi-plus me-1"></i>Add Note
              </button>
            </div>
          </div>` : ""}

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
    // _refreshExpLeft();
    renderExpandedView()
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
  if(!_expandedViewOpen) return;
  const overlay = document.getElementById("ticketExpandedOverlay");
  if (!overlay || overlay.style.display === "none") return;
  _renderExpHTML(overlay, false); // no animation on updates
}

function closeExpandedView() {
  _expandedViewOpen = false;
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
  // const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  // if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
  renderExpandedView();
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

function expSwitchTab(tab) {
  const commentsEl = document.getElementById("expTabComments");
  const notesEl    = document.getElementById("expTabNotes");
  const btnC       = document.getElementById("expTabBtnComments");
  const btnN       = document.getElementById("expTabBtnNotes");
  if (tab === "comments") {
    if (commentsEl) commentsEl.style.display = "flex";
    if (notesEl)    notesEl.style.display    = "none";
    if (btnC) { btnC.style.background = "#fff"; btnC.style.color = "#3b7cf4"; btnC.style.borderBottom = "2px solid #3b7cf4"; }
    if (btnN) { btnN.style.background = "transparent"; btnN.style.color = "#9aa5bc"; btnN.style.borderBottom = "2px solid transparent"; }
  } else {
    if (commentsEl) commentsEl.style.display = "none";
    if (notesEl)    { notesEl.style.display = "flex"; notesEl.style.flexDirection = "column"; }
    if (btnN) { btnN.style.background = "#fffbeb"; btnN.style.color = "#92400e"; btnN.style.borderBottom = "2px solid #f59e0b"; }
    if (btnC) { btnC.style.background = "transparent"; btnC.style.color = "#9aa5bc"; btnC.style.borderBottom = "2px solid transparent"; }
  }
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    expAddNote();
    expSubmitComment();
  }
})


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
let _expandedViewOpen = false;

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
  window.sortBy = IS_PM() ? pmSortBy : clientSortBy;
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
// Shared ticket detail/actions/notifications moved to features/shared-ticket-detail.js
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// CLIENT: TABLE
// ══════════════════════════════════════════════════════
// Client table state/filter/render moved to features/client-ticket-table.js

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
// PM table state/search/sort/pagination/render moved to features/pm-ticket-table.js
// PM quick actions (reassign/note/edit) moved to features/pm-ticket-actions.js

