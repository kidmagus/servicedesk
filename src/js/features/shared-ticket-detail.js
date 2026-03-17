// Shared ticket detail/actions/notifications extracted from main.js

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
            <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${linkify(c.text)}</p>
            ${c.attachments && c.attachments.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">${c.attachments.map((src) => `<img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join("")}</div>` : ""}
          </div>
        </div>`,
        )
        .join("")
    : '<p class="text-muted mb-0" style="font-size:13px">No comments yet.</p>';

  const actHTML =
    t.activity && t.activity.length
      ? `<div class="mb-4"><h6 class="fw-bold mb-2" style="font-size:14px">Activity Log</h6>
        ${t.activity.map((a) => `<div style="display: grid; grid-template-columns: 1fr 90px; font-size:12.5px;color:#7a8599;margin-bottom:6px;"><div><span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action} <b>${a.value || ""}</b></div><span class="ms-auto" style="font-size:11px;">${a.time}</span></div>`).join("")}
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
        pms = ["Matthew Samson", "John Doe"];
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
          <div class="avatar-sm ${t.ac || ""}" style="width:22px;height:22px;font-size:9px; background: #16a34a;">${initials(t.manager)}</div>
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
          <div class="avatar-sm" style="background:#3b7cf4;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter || "?")}</div>
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
    renderNotifList();
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
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
    renderExpandedView();
  // const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  // if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
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
  renderDetail();
  renderNotifList();
  IS_PM()
    ? document.getElementById("sec-tickets")?.offsetParent && pmRender()
    : clientRender();
    renderExpandedView();
  // const badgeWrap = document.querySelector("#expPanel .d-flex.gap-2.align-items-center");
  // if (badgeWrap) badgeWrap.innerHTML = statusBadgeHTML(t.status) + " " + prioBadgeHTML(t.priority) + " " + catBadge(t.category);
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
          `${CURRENT_USER}: commented on ${t.id}`,
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
}
function markAllRead() {
  NOTIFS.forEach((n) => (n.unread = false));
  renderNotifList();
}
function deleteAllNotifs() {
  NOTIFS.length = 0;
  renderNotifList();
}

// ══════════════════════════════════════════════════════


