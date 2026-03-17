// PM: client management and modal handlers extracted from main.js

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
